import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteArticle, fetchAllArticles } from "@/lib/admin-articles";
import { formatDate, type ArticleStatus } from "@/lib/articles";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchBar } from "@/components/site/SearchBar";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  component: AdminArticles,
});

const FILTERS: { key: string; label: string; match: (s: ArticleStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "drafts", label: "Drafts", match: (s) => s === "draft" },
  { key: "ready", label: "Ready", match: (s) => s === "ready" },
  {
    key: "published",
    label: "Published",
    match: (s) => s === "published_web" || s === "exported_substack",
  },
  { key: "substack", label: "Substack", match: (s) => s === "exported_substack" },
];

function AdminArticles() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: fetchAllArticles,
  });

  const remove = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      toast.success("Article deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter)!;
    const q = query.trim().toLowerCase();
    return articles
      .filter((a) => active.match(a.status))
      .filter((a) =>
        q
          ? [a.title, a.subtitle, a.excerpt, a.category, a.content, ...(a.tags ?? [])]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [articles, filter, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="pixel-font text-lg text-ink">Articles</h1>
        <Link
          to="/admin/write/$id"
          params={{ id: "new" }}
          className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-3 text-[11px] text-primary-foreground"
        >
          + New article
        </Link>
      </div>

      <div className="mt-6 max-w-sm">
        <SearchBar value={query} onChange={setQuery} placeholder="Search everything…" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`pixel-font border-2 border-ink px-3 py-1.5 text-[10px] ${
              filter === f.key ? "bg-ink text-background" : "bg-paper hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="mt-6 divide-y-2 divide-ink border-2 border-ink bg-paper">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Link
                to="/admin/write/$id"
                params={{ id: a.id }}
                className="min-w-0 flex-1 hover:text-primary"
              >
                <span className="font-serif text-base">{a.title}</span>
                <span className="pixel-font ml-3 text-[9px] text-muted-foreground">
                  {a.category}
                </span>
              </Link>
              <StatusBadge status={a.status} />
              <span className="pixel-font text-[10px] text-muted-foreground">
                {formatDate(a.updated_at)}
              </span>
              <button
                aria-label={`Delete ${a.title}`}
                onClick={() => {
                  if (confirm(`Delete "${a.title}"? This cannot be undone.`)) {
                    remove.mutate(a.id);
                  }
                }}
                className="pixel-panel p-2 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">Nothing here.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
