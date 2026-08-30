import { useEffect, useState, useCallback } from "react";

const NEWS_API_BASE = "/api";

type Article = {
  id: string;
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
  sourcesFailed?: string[];
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
  const diffHours = Math.round((Date.now() - date.getTime()) / 3_600_000);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function MarketPulseNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">("loading");
  const [category, setCategory] = useState("All Categories");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{ markdown: string } | null>(null);

  const fetchNews = useCallback(async (cat: string) => {
    setStatus("loading");
    try {
      const params = new URLSearchParams();
      if (cat !== "All Categories") params.set("category", cat);
      const res = await fetch(`${NEWS_API_BASE}/news?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: NewsResponse = await res.json();
      setArticles(data.items);
      setStatus(data.items.length === 0 ? "empty" : "ready");
      if (data.sourcesFailed?.length) {
        console.warn("Some news sources failed to load:", data.sourcesFailed);
      }
    } catch (err) {
      console.error("Failed to load market news:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateNewsletter = async () => {
    const chosen = articles.filter((a) => selected.has(a.id));
    if (chosen.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch(`${NEWS_API_BASE}/newsletter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: chosen, title: "Daily Wonder" }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setNewsletterResult(data);
    } catch (err) {
      console.error("Failed to generate newsletter:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
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
        <>
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
                  <label className="mt-2 flex cursor-pointer items-center gap-2 font-sans text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={selected.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="size-3.5 accent-current"
                    />
                    Add to Daily Wonder
                  </label>
                </div>
              </article>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="sticky bottom-4 mt-6 flex justify-center">
              <button
                onClick={generateNewsletter}
                disabled={generating}
                className="pixel-font border-2 border-ink bg-ink px-6 py-2 text-[10px] uppercase text-background shadow-[4px_4px_0_0_var(--color-ink)] disabled:opacity-50"
              >
                {generating ? "Generating…" : `Generate Daily Wonder (${selected.size} selected)`}
              </button>
            </div>
          )}

          {newsletterResult && (
            <div className="pixel-frame-sm mt-6 bg-paper p-4">
              <h3 className="pixel-font mb-2 text-sm text-ink">Draft ready</h3>
              <pre className="whitespace-pre-wrap font-sans text-xs text-ink">
                {newsletterResult.markdown}
              </pre>
            </div>
          )}
        </>
      )}
    </section>
  );
}
