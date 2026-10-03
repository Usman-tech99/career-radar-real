CREATE TABLE IF NOT EXISTS volunteers (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  preferred_name TEXT DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT DEFAULT '',
  university TEXT DEFAULT '',
  degree TEXT DEFAULT '',
  current_year TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  portfolio TEXT DEFAULT '',
  cv_url TEXT DEFAULT '',
  departments TEXT[] DEFAULT '{}',
  reason TEXT DEFAULT '',
  about TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  volunteered_before BOOLEAN DEFAULT FALSE,
  prev_organizations TEXT DEFAULT '',
  prev_roles TEXT DEFAULT '',
  prev_duration TEXT DEFAULT '',
  hours_per_week TEXT DEFAULT '',
  preferred_time TEXT DEFAULT '',
  preferred_channel TEXT DEFAULT '',
  biggest_strength TEXT DEFAULT '',
  skill_to_develop TEXT DEFAULT '',
  proud_project TEXT DEFAULT '',
  heard_from TEXT DEFAULT '',
  agreement_volunteer BOOLEAN DEFAULT FALSE,
  agreement_hours BOOLEAN DEFAULT FALSE,
  agreement_conduct BOOLEAN DEFAULT FALSE,
  agreement_accurate BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "insert_volunteers" ON volunteers;
CREATE POLICY "insert_volunteers" ON volunteers FOR INSERT WITH CHECK (true);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_select_volunteers" ON volunteers;
CREATE POLICY "super_admin_select_volunteers" ON volunteers FOR SELECT USING (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_update_volunteers" ON volunteers;
CREATE POLICY "super_admin_update_volunteers" ON volunteers FOR UPDATE USING (get_my_role() = 'super_admin');

SELECT pg_notify('pgrst', 'reload schema');
