CREATE TABLE IF NOT EXISTS popup_settings (
  id BIGSERIAL PRIMARY KEY,
  image_url TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  link_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  show_on_entry BOOLEAN DEFAULT true,
  show_on_exit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE popup_settings ENABLE ROW LEVEL SECURITY;

-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "select_popup_settings" ON popup_settings;
CREATE POLICY "select_popup_settings" ON popup_settings FOR SELECT USING (true);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_popup_settings" ON popup_settings;
CREATE POLICY "super_admin_all_popup_settings" ON popup_settings FOR ALL USING (get_my_role() = 'super_admin');

SELECT pg_notify('pgrst', 'reload schema');
