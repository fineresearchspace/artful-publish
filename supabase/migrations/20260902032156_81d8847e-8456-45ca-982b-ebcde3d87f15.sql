ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_status_check;
UPDATE public.articles SET status = 'exported_substack' WHERE status = 'published_substack';
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check CHECK (status IN ('draft','ready','published_web','exported_substack','failed'));
DROP POLICY IF EXISTS "Published articles are public" ON public.articles;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT
  USING (status IN ('published_web','exported_substack'));
CREATE OR REPLACE FUNCTION public.increment_article_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.articles SET view_count = view_count + 1
  WHERE slug = _slug AND status IN ('published_web','exported_substack');
$$;