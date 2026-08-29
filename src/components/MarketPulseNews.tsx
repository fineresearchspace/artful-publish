import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMarketNews, type NewsItem } from "@/lib/news.functions";
import { NEWS_CATEGORIES } from "@/lib/news/scoring";

function formatDate(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.round(diffMs / 3_600_000);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function MarketPulseNews() {
  const fetchNewsFn = useServerFn(getMarketNews);
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");
  const [category, setCategory] = useState("All Categories");

  const fetchNews = useCallback(
    async (cat: string) => {
      setStatus("loading");
      try {
        const data = await fetchNewsFn({ data: { category: cat, limit: 24 } });
        setArticles(data.news);
        setStatus(data.news.length === 0 ? "empty" : "ready");
      } catch (err) {
        console.error("Failed to load market news:", err);
        setStatus("error");
      }
    },
    [fetchNewsFn],
  );

  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="pixel-font text-2xl text-ink">Market News</h2>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-ink bg-paper px-3 py-1.5 text-sm outline-none focus:border-primary"
          >
            {NEWS_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => fetchNews(category)}
            className="pixel-font border-2 border-ink bg-paper px-3 py-1.5 text-[10px] uppercase transition-colors hover:bg-accent"
          >
            Refresh
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="py-12 text-center font-serif text-sm text-muted-foreground">
          Loading latest market news…
        </div>
      )}

      {status === "error" && (
        <div className="py-12 text-center font-serif text-sm text-destructive">
          Couldn’t load news right now. Try refreshing in a moment.
        </div>
      )}

      {status === "empty" && (
        <div className="py-12 text-center font-serif text-sm text-muted-foreground">
          No stories in this category yet.
        </div>
      )}

      {status === "ready" && (
        <ul className="divide-y-2 divide-ink border-y-2 border-ink">
          {articles.map((item) => (
            <li key={item.id} className="py-4">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <h3 className="font-serif text-lg font-semibold leading-snug text-ink group-hover:text-primary">
                  {item.headline}
                </h3>
                <p className="mt-1 font-sans text-xs text-muted-foreground">
                  <span className="pixel-font uppercase">{item.source}</span>
                  {" · "}
                  {formatDate(item.publishedAt)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="pixel-font border border-ink px-2 py-0.5 text-[9px] uppercase">
                    {item.category}
                  </span>
                  {item.tags.map((tag) => (
                    <span key={tag} className="pixel-font text-[9px] uppercase text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
