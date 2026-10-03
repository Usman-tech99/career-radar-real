-- Helper functions for certificate system
-- These are required by the certificate tables and edge functions

-- get_my_role() - Required for RLS policies
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = (SELECT auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- handle_updated_at() - Required for auto-updating timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
