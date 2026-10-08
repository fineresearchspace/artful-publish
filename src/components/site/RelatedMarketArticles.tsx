import { useEffect, useState } from "react";
import { relatedHeadlines, type MarketNewsTab, type NewsArticle } from "@/lib/headlines";

export function RelatedMarketArticles({ tab }: { tab: MarketNewsTab }) {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/news?limit=100", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Headlines unavailable");
        const data = await response.json() as { items: NewsArticle[] };
        setItems(data.items ?? []);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, []);

  const articles = relatedHeadlines(items, tab);
  return (
    <section className="mt-10 border-t border-border pt-6" aria-label="Related articles">
      <h2 className="display-font text-2xl text-ink">Related articles</h2>
      {status === "loading" ? <p className="mt-4 text-sm text-muted-foreground">Loading related articles…</p>
        : status === "error" ? <p className="mt-4 text-sm text-muted-foreground">Related articles are temporarily unavailable.</p>
        : articles.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No recent articles for this market group yet.</p>
        : <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {articles.map((article) => (
            <a key={article.id} href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="group min-w-0 border-b border-border pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <p className="font-editorial-ui text-xs text-muted-foreground">{article.source}</p>
              <h3 className="mt-2 font-serif text-lg leading-snug text-ink group-hover:text-primary">{article.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>
            </a>
          ))}
        </div>}
    </section>
  );
}