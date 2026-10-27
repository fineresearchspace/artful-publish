CREATE POLICY "Authors can read article images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'article-images');
CREATE POLICY "Authors can upload article images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'article-images');
CREATE POLICY "Authors can update article images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'article-images') WITH CHECK (bucket_id = 'article-images');
CREATE POLICY "Authors can delete article images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'article-images');