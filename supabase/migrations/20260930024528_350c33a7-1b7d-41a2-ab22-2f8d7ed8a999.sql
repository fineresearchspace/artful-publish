CREATE POLICY "Public can read article images"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'article-images');