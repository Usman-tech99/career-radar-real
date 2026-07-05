SELECT pg_notify('pgrst', 'reload schema');

UPDATE site_stats SET scholarship_channel_followers = 500, ai_channel_followers = 400 WHERE id = 1;
