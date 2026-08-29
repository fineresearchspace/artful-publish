import { useEffect, useState, useCallback } from "react";

// API base URL is read from an env var so it can be set without touching code.
// Add VITE_MARKET_NEWS_API to the project's environment variables (Vercel + local .env)
// pointing at the deployed news backend, e.g. https://your-news-api.onrender.com/api
const NEWS_API_BASE = import.meta.env.VITE_MARKET_NEWS_API ?? "";

type Article = {
  id: number;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  category: string;
  impactLabel?: "HIGH" | "MEDIUM" | "LOW";
};

type NewsResponse = {
  items: Article[];
  total: number;
};

const CATEGORIES = [
  "All Categories",
  "Markets",
  "Economy & Policy",
  "Companies & Corporate",
  "Industries",
  "Global Business",
  "Investing",
];

function formatDate(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.round(diffMs / 3_600_000);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function MarketPulseNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");
  const [category, setCategory] = useState("All Categories");

  const fetchNews = useCallback(async (cat: string) => {
    if (!NEWS_API_BASE) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const params = new URLSearchParams();
      if (cat !== "All Categories") params.set("category", cat);
      const res = await fetch(`${NEWS_API_BASE}/news?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: NewsResponse = await res.json();
      setArticles(data.items);
      setStatus(data.items.length === 0 ? "empty" : "ready");
    } catch (err) {
      console.error("Failed to load market news:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="pixel-font text-2xl text-ink">Market Pulse</h2>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-ink bg-paper px-3 py-1.5 text-sm outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => (
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="pixel-frame-sm pixel-lift flex flex-col overflow-hidden bg-paper"
            >
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt=""
                  className="h-40 w-full border-b-2 border-ink object-cover pixelated"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="pixel-font uppercase">{article.source}</span>
                  <span className="font-sans">{formatDate(article.publishedAt)}</span>
                </div>
                <h3 className="font-serif text-lg font-semibold leading-snug text-ink">
                  {article.title}
                </h3>
                <p className="flex-1 font-sans text-sm text-muted-foreground">{article.summary}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="pixel-font border border-ink px-2 py-0.5 text-[9px] uppercase">
                    {article.category}
                  </span>
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm font-medium text-primary underline underline-offset-2"
                  >
                    Read Original →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
