-- ===========================================================================
-- Include signatories, UUID, template_snapshot, and pdf_path in public verification
-- ===========================================================================

CREATE OR REPLACE FUNCTION public_verify_certificate(
  p_reference TEXT,
  p_method TEXT DEFAULT 'certificate_id',
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref TEXT := btrim(COALESCE(p_reference, ''));
  v_method TEXT := CASE
                     WHEN p_method IN ('certificate_id','verification_url','qr_code') THEN p_method
                     ELSE 'certificate_id'
                   END;
  v_by_token BOOLEAN := v_method IN ('verification_url','qr_code');
  v_row certificates%ROWTYPE;
  v_found BOOLEAN := FALSE;
  v_superseded_by_cert_id TEXT := NULL;
  v_supersedes_cert_id TEXT := NULL;
BEGIN
  IF v_ref = '' THEN
    RAISE EXCEPTION 'A certificate reference is required';
  END IF;

  IF v_by_token THEN
    SELECT * INTO v_row FROM certificates WHERE verification_token = lower(v_ref);
    IF NOT FOUND THEN
      SELECT * INTO v_row FROM certificates WHERE certificate_id = upper(v_ref);
    END IF;
  ELSE
    SELECT * INTO v_row FROM certificates WHERE certificate_id = upper(v_ref);
    IF NOT FOUND THEN
      SELECT * INTO v_row FROM certificates WHERE verification_token = lower(v_ref);
    END IF;
  END IF;
  v_found := (v_row.id IS NOT NULL);

  -- Record event (non-blocking)
  BEGIN
    INSERT INTO certificate_verification_events
      (certificate_id, looked_up_reference, method, outcome, certificate_status, ip_hash, user_agent)
    VALUES
      (CASE WHEN v_found THEN v_row.id END,
       left(v_ref, 120), v_method,
       CASE WHEN v_found THEN 'found' ELSE 'not_found' END,
       CASE WHEN v_found THEN v_row.status END,
       p_ip_hash, left(COALESCE(p_user_agent,''), 300));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF NOT v_found THEN
    RETURN json_build_object('found', false);
  END IF;

  -- Bump counter
  BEGIN
    PERFORM record_certificate_verification(v_row.id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Safely resolve superseded certificate_id if present
  IF v_row.superseded_by_id IS NOT NULL THEN
    SELECT certificate_id INTO v_superseded_by_cert_id FROM certificates WHERE id = v_row.superseded_by_id;
  END IF;
  IF v_row.supersedes_id IS NOT NULL THEN
    SELECT certificate_id INTO v_supersedes_cert_id FROM certificates WHERE id = v_row.supersedes_id;
  END IF;

  RETURN json_build_object(
    'found',                 true,
    'id',                    v_row.id,
    'certificate_id',        v_row.certificate_id,
    'verification_token',    v_row.verification_token,
    'recipient_name',        v_row.recipient_name,
    'certificate_title',     v_row.certificate_title,
    'description',           v_row.description,
    'achievement',           v_row.achievement,
    'certificate_type',      COALESCE(v_row.custom_fields->>'certificate_type', v_row.template_snapshot->>'certificate_type', 'appreciation'),
    'issue_date',            v_row.issue_date,
    'organization_name',     v_row.organization_name,
    'organization_logo_url', v_row.organization_logo_url,
    'signatory_1_name',      v_row.signatory_1_name,
    'signatory_1_title',     v_row.signatory_1_title,
    'signatory_1_image_url', v_row.signatory_1_image_url,
    'signatory_2_name',      v_row.signatory_2_name,
    'signatory_2_title',     v_row.signatory_2_title,
    'signatory_2_image_url', v_row.signatory_2_image_url,
    'template_snapshot',     v_row.template_snapshot,
    'pdf_path',              v_row.pdf_path,
    'status',                v_row.status,
    'revoked_at',            v_row.revoked_at,
    'revocation_reason',     v_row.revocation_reason,
    'version',               v_row.version,
    'superseded_by_id',      v_superseded_by_cert_id,
    'supersedes_id',         v_supersedes_cert_id,
    'custom_fields',         v_row.custom_fields,
    'verification_count',    COALESCE(v_row.verification_count, 0) + 1,
    'last_verified_at',      NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION public_verify_certificate(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_verify_certificate(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
