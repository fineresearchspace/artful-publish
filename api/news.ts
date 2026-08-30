import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAndProcessNews } from "./lib/news-core";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rssConfig = process.env.NEWS_RSS_URLS;
  if (!rssConfig) {
    return res.status(500).json({
      error: "NEWS_RSS_URLS environment variable is not configured on Vercel.",
    });
  }

  const { category, source, search, minImpact, page, limit } = req.query;

  try {
    const { articles, failedSources, sourcesTotal } = await fetchAndProcessNews(rssConfig, {
      category: typeof category === "string" ? category : undefined,
      source: typeof source === "string" ? source : undefined,
      search: typeof search === "string" ? search : undefined,
      minImpact: minImpact ? Number(minImpact) : undefined,
    });

    const pageNum = page ? Math.max(1, Number(page)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, Number(limit))) : 30;
    const start = (pageNum - 1) * limitNum;

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json({
      items: articles.slice(start, start + limitNum),
      total: articles.length,
      page: pageNum,
      limit: limitNum,
      sourcesTotal,
      sourcesFailed: failedSources,
    });
  } catch (err) {
    console.error("[/api/news] failed:", err);
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
