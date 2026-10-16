-- Migration: 202610160001_recipient_my_certificates.sql
-- Description: Enable certificate recipients to view and manage their certificates via their user account.

-- 1. Index on lower(recipient_email) for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_certificates_recipient_email_lower
  ON certificates(lower(recipient_email));

-- 2. Update RLS policy so logged-in users can read their certificates either by UUID or email match
DROP POLICY IF EXISTS "certificates_recipient_select" ON certificates;

CREATE POLICY "certificates_recipient_select" ON certificates FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid())
    OR (
      recipient_email IS NOT NULL
      AND lower(recipient_email) = lower(COALESCE(auth.jwt()->>'email', (SELECT email FROM auth.users WHERE id = auth.uid())))
    )
  );

-- 3. Dedicated SECURITY DEFINER RPC for authenticated users to retrieve their own certificates safely
CREATE OR REPLACE FUNCTION public.get_my_certificates()
RETURNS SETOF certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  RETURN QUERY
  SELECT * FROM certificates
  WHERE recipient_user_id = v_uid
     OR (v_email IS NOT NULL AND lower(recipient_email) = lower(v_email))
  ORDER BY issue_date DESC, created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_certificates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_certificates() TO authenticated;

-- 4. Auto-link trigger: when a certificate is inserted/updated with an email, link to auth.users if already registered
CREATE OR REPLACE FUNCTION public.link_certificate_recipient_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recipient_user_id IS NULL AND NEW.recipient_email IS NOT NULL THEN
    SELECT id INTO NEW.recipient_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.recipient_email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_certificate_recipient_user ON certificates;
CREATE TRIGGER trg_link_certificate_recipient_user
  BEFORE INSERT OR UPDATE OF recipient_email ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.link_certificate_recipient_user();

-- 5. Auto-link trigger: when a new user registers or updates their email, link any existing unlinked certificates
CREATE OR REPLACE FUNCTION public.link_user_to_certificates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.certificates
    SET recipient_user_id = NEW.id
    WHERE recipient_user_id IS NULL
      AND lower(recipient_email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_user_to_certificates ON auth.users;
CREATE TRIGGER trg_link_user_to_certificates
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_user_to_certificates();
