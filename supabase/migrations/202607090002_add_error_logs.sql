CREATE TABLE IF NOT EXISTS error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  stack TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_select_error_logs" ON error_logs;
CREATE POLICY "super_admin_select_error_logs" ON error_logs
  FOR SELECT USING (get_my_role() = 'super_admin');

-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "insert_error_logs" ON error_logs;
CREATE POLICY "insert_error_logs" ON error_logs
  FOR INSERT WITH CHECK (true);

SELECT pg_notify('pgrst', 'reload schema');
