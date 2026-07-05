-- Set default stat values for the site_stats singleton row
UPDATE site_stats
SET community_members = 1350,
    countries = 12,
    whatsapp_groups = 9,
    main_channel_followers = 1200,
    scholarship_channel_followers = 500,
    ai_channel_followers = 400
WHERE id = 1;
