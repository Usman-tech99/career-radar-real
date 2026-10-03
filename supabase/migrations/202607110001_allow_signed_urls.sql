-- Allow anyone to generate signed URLs for product-files (bucket stays private, no direct public access)
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "prod_files_signed_url_select" ON storage.objects;
CREATE POLICY "prod_files_signed_url_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-files');
