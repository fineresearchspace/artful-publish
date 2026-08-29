import type { NewsItem } from "../news.functions";

type Row = {
  id: string;
  headline: string;
  source: string;
  source_url: string;
  published_at: string;
  category: string;
  relevance_tags: string[] | null;
  market_relevance_score: number;
};

const STALE_MS = 20 * 60 * 1000;

export async function loadMarketNews(
  category?: string,
  limit = 24,
): Promise<{ news: NewsItem[] }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as {
    from: (table: string) => any;
  };

  const newest = await db
    .from("market_news")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  const latest = newest.data?.[0]?.updated_at as string | undefined;
  const stale = !latest || Date.now() - new Date(latest).getTime() > STALE_MS;

  if (stale) {
    try {
      const { refreshMarketNews } = await import("./ingest.server");
      await refreshMarketNews();
    } catch (error) {
      console.error("[news] refresh during read failed", error);
    }
  }

  let query = db
    .from("market_news")
    .select("id, headline, source, source_url, published_at, category, relevance_tags, market_relevance_score")
    .order("market_relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category && category !== "All Categories") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[news] read failed", error);
    throw new Error("Could not load market news");
  }

  const news: NewsItem[] = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    headline: r.headline,
    source: r.source,
    publishedAt: r.published_at,
    category: r.category,
    relevanceScore: r.market_relevance_score,
    tags: r.relevance_tags ?? [],
    url: r.source_url,
  }));

  return { news };
}
