DROP POLICY IF EXISTS "Authors can delete article images" ON storage.objects;
DROP POLICY IF EXISTS "Authors can read article images" ON storage.objects;
DROP POLICY IF EXISTS "Authors can update article images" ON storage.objects;
DROP POLICY IF EXISTS "Authors can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read article images" ON storage.objects;

CREATE POLICY "Admin can read article images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin can upload article images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin can update article images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin can delete article images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));