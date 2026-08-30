import { createFileRoute } from "@tanstack/react-router";
import { fetchAndProcessNews } from "../../api/lib/news-core";

const DEFAULT_RSS = [
  "Reuters|https://news.google.com/rss/search?q=when:2d+reuters.com+markets&hl=en-US&gl=US&ceid=US:en",
  "CNBC|https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
  "Yahoo Finance|https://finance.yahoo.com/news/rssindex",
  "The Economic Times|https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "Business Standard|https://www.business-standard.com/rss/markets-106.rss",
].join(",");

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rssConfig = process.env["NEWS_RSS_URLS"] || DEFAULT_RSS;

        try {
          const { articles, failedSources, sourcesTotal } = await fetchAndProcessNews(rssConfig, {
            category: url.searchParams.get("category") ?? undefined,
            source: url.searchParams.get("source") ?? undefined,
            search: url.searchParams.get("search") ?? undefined,
            minImpact: url.searchParams.get("minImpact")
              ? Number(url.searchParams.get("minImpact"))
              : undefined,
          });

          const pageNum = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
          const limitNum = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "30")));
          const start = (pageNum - 1) * limitNum;

          return Response.json(
            {
              items: articles.slice(start, start + limitNum),
              total: articles.length,
              page: pageNum,
              limit: limitNum,
              sourcesTotal,
              sourcesFailed: failedSources,
            },
            { headers: { "cache-control": "s-maxage=300, stale-while-revalidate=600" } },
          );
        } catch (err) {
          console.error("[/api/news] failed:", err);
          return Response.json({ error: "Failed to fetch news" }, { status: 500 });
        }
      },
    },
  },
});
