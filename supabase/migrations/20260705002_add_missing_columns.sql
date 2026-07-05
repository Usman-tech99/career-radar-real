ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS countries INTEGER DEFAULT 0;
ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS whatsapp_groups INTEGER DEFAULT 0;
ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS main_channel_followers INTEGER DEFAULT 0;
ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS scholarship_channel_followers INTEGER DEFAULT 0;
ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS ai_channel_followers INTEGER DEFAULT 0;

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_label TEXT DEFAULT '';
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

ALTER TABLE community_page ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]';
ALTER TABLE community_page ADD COLUMN IF NOT EXISTS volunteer_program JSONB DEFAULT '{"heading":"Volunteer Program","text":"","image_url":""}';
ALTER TABLE community_page ADD COLUMN IF NOT EXISTS success_stories JSONB DEFAULT '[]';
