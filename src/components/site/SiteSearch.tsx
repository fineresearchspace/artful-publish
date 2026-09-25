import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LoaderCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

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
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery("");
        }}
      >
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className="top-[12vh] max-h-[76vh] max-w-2xl translate-y-0 overflow-hidden border-border bg-paper p-0 sm:rounded-xl"
        >
          <div className="border-b border-border px-5 py-5 pr-12">
            <DialogTitle className="display-font text-2xl font-normal text-ink">
              Search The Context
            </DialogTitle>
            <DialogDescription className="mt-1">
              Find articles by title, topic, summary, or tag.
            </DialogDescription>
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
        </DialogContent>
      </Dialog>
    </>
  );
}