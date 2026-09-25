import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/articles";
import {
  listPublishedArticles,
  type ArticleListItem,
} from "@/lib/public-articles.functions";

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || status !== "idle") return;
    let active = true;
    setStatus("loading");
    listPublishedArticles()
      .then((result) => {
        if (!active) return;
        setArticles(result.articles);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open, status]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return articles.slice(0, 6);
    return articles
      .filter((article) =>
        [article.title, article.subtitle, article.excerpt, article.category, ...(article.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 10);
  }, [articles, query]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search the site"
        title="Search articles"
        onClick={() => setOpen(true)}
        className="rounded-full text-muted-foreground hover:text-foreground"
      >
        <Search aria-hidden="true" />
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-foreground/70 px-4 py-[12vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
              setQuery("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-search-title"
            aria-describedby="site-search-description"
            className="relative mx-auto max-h-[76vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-paper shadow-[var(--shadow-pixel-lg)]"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close search"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="absolute right-3 top-3 z-10 rounded-full"
            >
              <X aria-hidden="true" />
            </Button>
          <div className="border-b border-border px-5 py-5 pr-12">
            <h2 id="site-search-title" className="display-font text-2xl font-normal text-ink">
              Search The Context
            </h2>
            <p id="site-search-description" className="mt-1 text-sm text-muted-foreground">
              Find articles by title, topic, summary, or tag.
            </p>
          </div>
          <label className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search all articles…"
              aria-label="Search all articles"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="max-h-[48vh] overflow-y-auto p-3">
            {status === "loading" ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Loading the archive…
              </div>
            ) : status === "error" ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Search is temporarily unavailable.
              </p>
            ) : results.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No articles match “{query}”.
              </p>
            ) : (
              <ul>
                {results.map((article) => (
                  <li key={article.id}>
                    <Link
                      to="/articles/$slug"
                      params={{ slug: article.slug }}
                      onClick={() => setOpen(false)}
                      className="group flex gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-accent"
                    >
                      {article.cover_image ? (
                        <img
                          src={article.cover_image}
                          alt=""
                          className="h-16 w-20 shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="pixel-font text-[9px] text-primary">{article.category}</span>
                        <span className="mt-1 block font-serif text-lg leading-tight text-foreground group-hover:text-primary">
                          {article.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatDate(article.published_at)} · {article.reading_time} min read
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border px-5 py-3 text-right">
            <Link
              to="/articles"
              onClick={() => setOpen(false)}
              className="pixel-font text-[9px] text-primary hover:underline"
            >
              Browse the full archive →
            </Link>
          </div>
          </section>
        </div>
      ) : null}
    </>
  );
}