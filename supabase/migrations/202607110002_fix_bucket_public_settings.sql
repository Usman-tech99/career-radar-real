-- Fix bucket public/private settings
-- content-files: public URLs stored in DB, bucket must be public
UPDATE storage.buckets SET public = true WHERE name = 'content-files';
-- product-files: downloaded via Vercel proxy with service_role, should be private
UPDATE storage.buckets SET public = false WHERE name = 'product-files';
