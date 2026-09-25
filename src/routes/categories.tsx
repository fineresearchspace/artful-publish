import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PixelArt } from "@/components/PixelArt";
import { listPublishedArticles } from "@/lib/public-articles.functions";
import { formatDate } from "@/lib/articles";

export const Route = createFileRoute("/categories")({
  loader: () => listPublishedArticles(),
  head: () => ({
    meta: [
      { title: "Topics — The Context" },
      {
        name: "description",
        content:
          "Browse The Context by topic: markets, finance, business, mindset, deep dives and ideas.",
      },
      { property: "og:title", content: "Topics — The Context" },
      {
        property: "og:description",
        content: "Browse the The Context archive by topic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/categories" },
    ],
    links: [{ rel: "canonical", href: "/categories" }],
  }),
  component: CategoriesPage,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-sm text-muted-foreground">
        Topics could not be loaded.
      </p>
    </SiteShell>
  ),
});

const ART = ["chart", "newspaper", "portfolio", "thinking", "office", "coin"];

function CategoriesPage() {
  const { articles, categories } = Route.useLoaderData();

  return (
    <SiteShell>
      <section className="border-b border-border bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="display-font text-4xl text-ink sm:text-5xl">Topics</h1>
          <p className="mt-4 max-w-xl font-serif text-lg text-muted-foreground">
            The same curiosity, sorted into shelves.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
        {categories.map((category, index) => {
          const items = articles.filter((a) => a.category === category.name);
          return (
            <div key={category.id} className="pixel-frame p-6">
              <div className="flex items-start gap-4">
                <PixelArt
                  variant={ART[index % ART.length]!}
                  className="size-12 shrink-0 border border-border"
                />
                <div>
                  <h2 className="display-font text-2xl text-ink">{category.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                </div>
                <span className="pixel-font ml-auto text-[10px] text-muted-foreground">
                  {items.length} {items.length === 1 ? "wonder" : "wonders"}
                </span>
              </div>

              {items.length ? (
                <ul className="mt-5 divide-y-2 divide-ink border-t border-border">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/articles/$slug"
                        params={{ slug: item.slug }}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 hover:text-primary"
                      >
                        <span className="font-serif text-lg">{item.title}</span>
                        <span className="pixel-font ml-auto text-[10px] text-muted-foreground">
                          {formatDate(item.published_at)} · {item.reading_time} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
              )}
            </div>
          );
        })}
      </section>
    </SiteShell>
  );
}
