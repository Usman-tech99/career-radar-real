CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  show_on_entry BOOLEAN DEFAULT true,
  show_on_exit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_announcements" ON announcements;
CREATE POLICY "select_announcements" ON announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "super_admin_all_announcements" ON announcements;
CREATE POLICY "super_admin_all_announcements" ON announcements FOR ALL USING ((SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'super_admin');

SELECT pg_notify('pgrst', 'reload schema');
