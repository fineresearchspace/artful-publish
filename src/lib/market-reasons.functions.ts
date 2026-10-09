import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchAndProcessNews } from "@/lib/news-core";
import { marketNewsTerms, selectMarketNews, type MarketStory } from "@/lib/market-news";

const RSS = [
  "Reuters|https://news.google.com/rss/search?q=when:2d+reuters.com+markets&hl=en-US&gl=US&ceid=US:en",
  "CNBC|https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
  "The Economic Times|https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "Mint|https://www.livemint.com/rss/markets",
  "Investing.com|https://www.investing.com/rss/news_25.rss",
  "Investing.com|https://www.investing.com/rss/news.rss",
].join(",");

export type MarketReasons = {
  drivers: MarketStory[];
  related: MarketStory[];
  asOf: string;
  unavailable: boolean;
};
const cache = new Map<string, { at: number; value: MarketReasons }>();

export const explainMarketMove = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({
    symbol: z.string().min(1).max(40),
    name: z.string().min(1).max(80),
    region: z.string().max(40),
    changePercent: z.number().nullable(),
  }).parse(input))
  .handler(async ({ data }): Promise<MarketReasons> => {
    const key = `${data.symbol}|${data.name}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
    const terms = marketNewsTerms(data.symbol, data.name);
    const query = `(${terms.map((term) => `"${term}"`).join(" OR ")}) (rises OR falls OR gains OR drops OR market) when:2d`;
    // Topic-specific reporting supplements the general feed for less-covered indicators.
    const topicFeed = `Google News|https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const { articles } = await fetchAndProcessNews(`${process.env["NEWS_RSS_URLS"] || RSS},${topicFeed}`);
      const stories: MarketStory[] = articles.map((article) => ({
        title: article.title,
        url: article.sourceUrl,
        source: article.source,
        // Only publisher text; do not use the generic relevance-summary fallback.
        summary: (article.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 360),
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
      }));
      const value = { ...selectMarketNews(stories, data.symbol, data.name), asOf: new Date().toISOString(), unavailable: false };
      cache.set(key, { at: Date.now(), value });
      return value;
    } catch {
      return { drivers: [], related: [], asOf: new Date().toISOString(), unavailable: true };
    }
  });
