CREATE TABLE IF NOT EXISTS public.market_news (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  source text not null,
  source_url text not null,
  canonical_key text not null unique,
  published_at timestamptz not null,
  category text not null default 'Markets',
  relevance_tags text[] not null default '{}',
  market_relevance_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS market_news_rank_idx ON public.market_news (market_relevance_score DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS market_news_category_idx ON public.market_news (category);

GRANT SELECT ON public.market_news TO anon;
GRANT SELECT ON public.market_news TO authenticated;
GRANT ALL ON public.market_news TO service_role;

ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market news is publicly readable" ON public.market_news;
CREATE POLICY "Market news is publicly readable"
ON public.market_news FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.set_market_news_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_market_news_updated_at ON public.market_news;
CREATE TRIGGER update_market_news_updated_at
BEFORE UPDATE ON public.market_news
FOR EACH ROW EXECUTE FUNCTION public.set_market_news_updated_at();