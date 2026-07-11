-- Allow anyone to generate signed URLs for product-files (bucket stays private, no direct public access)
CREATE POLICY "prod_files_signed_url_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-files');
