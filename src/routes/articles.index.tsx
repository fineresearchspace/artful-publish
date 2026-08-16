import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { ArticleCard } from "@/components/site/ArticleCard";
import { SearchBar } from "@/components/site/SearchBar";
import { listPublishedArticles } from "@/lib/public-articles.functions";

export const Route = createFileRoute("/articles/")({
  loader: () => listPublishedArticles(),
  head: () => ({
    meta: [
      { title: "The Archive — Weekly Wonders" },
      {
        name: "description",
        content:
          "Every Weekly Wonders article: markets, finance, business, mindset and ideas worth understanding.",
      },
      { property: "og:title", content: "The Archive — Weekly Wonders" },
      {
        property: "og:description",
        content: "Every Weekly Wonders article, collected as pixel-art cards.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/articles" },
    ],
    links: [{ rel: "canonical", href: "/articles" }],
  }),
  component: ArticlesPage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-sm text-muted-foreground">
        The archive could not be loaded.
      </p>
    </SiteShell>
  ),
});

function ArticlesPage() {
  const { articles, categories } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.subtitle, a.excerpt, a.category, ...(a.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [articles, query, category]);

  return (
    <SiteShell>
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="pixel-font text-2xl text-ink sm:text-3xl">The Archive</h1>
          <p className="mt-4 max-w-xl font-serif text-lg text-muted-foreground">
            {articles.length} wonders collected so far. Search by title, topic or tag.
          </p>
          <div className="mt-6 max-w-md">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {["All", ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              className={`pixel-font border-2 border-ink px-3 py-1.5 text-[10px] ${
                category === name ? "bg-ink text-background" : "bg-paper hover:bg-accent"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="mt-12 text-sm text-muted-foreground">No wonders match that search.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
