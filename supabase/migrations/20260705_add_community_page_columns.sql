ALTER TABLE community_page ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]';
ALTER TABLE community_page ADD COLUMN IF NOT EXISTS volunteer_program JSONB DEFAULT '{"heading":"Volunteer Program","text":"","image_url":""}';
ALTER TABLE community_page ADD COLUMN IF NOT EXISTS success_stories JSONB DEFAULT '[]';
