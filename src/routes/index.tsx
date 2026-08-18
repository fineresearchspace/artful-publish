import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { ArticleCard } from "@/components/site/ArticleCard";
import { PixelArt } from "@/components/PixelArt";
import { listPublishedArticles } from "@/lib/public-articles.functions";
import { formatDate } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  loader: () => listPublishedArticles(),
  head: () => ({
    meta: [
      { title: "Weekly Wonders — Ideas worth wondering about" },
      {
        name: "description",
        content:
          "A pixel-art archive of curious ideas about markets, money, business and the world around them.",
      },
      { property: "og:title", content: "Weekly Wonders — Ideas worth wondering about" },
      {
        property: "og:description",
        content: "Curious ideas about markets, money, business and the world around them.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-sm text-muted-foreground">
        The archive could not be loaded. Please refresh.
      </p>
    </SiteShell>
  ),
});

function Home() {
  const { articles, categories } = Route.useLoaderData();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const featured = useMemo(
    () => articles.find((a) => a.featured) ?? articles[0],
    [articles],
  );
  const rest = useMemo(
    () =>
      articles.length > 1
        ? articles.filter((a) => a.id !== featured?.id)
        : articles,
    [articles, featured],
  );
  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? rest
        : rest.filter((a) => a.category === activeCategory),
    [rest, activeCategory],
  );

  const filters = ["All", ...categories.map((c) => c.name)];

  return (
    <SiteShell>
      {/* Hero */}
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6 md:py-24">
          <div className="flex items-end gap-4">
            <PixelArt variant="coin" className="pixel-bob size-14 border-2 border-ink" />
            <h1 className="pixel-font text-3xl leading-tight text-ink sm:text-5xl">
              Weekly Wonders
            </h1>
            <PixelArt variant="chart" className="pixel-bob size-14 border-2 border-ink" />
          </div>
          <div className="pixel-rule w-40" />
          <p className="max-w-xl font-serif text-lg text-muted-foreground sm:text-xl">
            {SITE.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/articles"
              className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-3 text-[11px] text-primary-foreground"
            >
              Browse the archive →
            </Link>
            <a
              href={SITE.substackSubscribeUrl}
              target="_blank"
              rel="noreferrer"
              className="pixel-frame-sm pixel-lift pixel-font bg-paper px-4 py-3 text-[11px]"
            >
              Newsletter →
            </a>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="pixel-font text-[11px] text-primary">[ Featured Wonder ]</p>
          <Link
            to="/articles/$slug"
            params={{ slug: featured.slug }}
            className="pixel-frame pixel-lift mt-5 grid gap-0 overflow-hidden md:grid-cols-2"
          >
            <div className="crt aspect-[16/10] border-b-2 border-ink md:aspect-auto md:border-b-0 md:border-r-2">
              {featured.cover_image ? (
                <img
                  src={featured.cover_image}
                  alt=""
                  className="pixelated size-full object-cover"
                />
              ) : (
                <PixelArt variant={featured.pixel_art_image} className="size-full" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-4 p-7 md:p-10">
              <span className="pixel-font text-[10px] text-primary">{featured.category}</span>
              <h2 className="font-serif text-2xl leading-tight sm:text-3xl">{featured.title}</h2>
              {featured.subtitle ? (
                <p className="font-serif text-lg text-muted-foreground">{featured.subtitle}</p>
              ) : null}
              <p className="pixel-font text-[10px] text-muted-foreground">
                {featured.reading_time} min read · {formatDate(featured.published_at)}
              </p>
              <span className="pixel-font text-[11px]">Read →</span>
            </div>
          </Link>
        </section>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pixel-rule" />
      </div>

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="pixel-font text-sm text-ink">Latest Wonders</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory(name)}
                className={`pixel-font border-2 border-ink px-3 py-1.5 text-[10px] transition-colors ${
                  activeCategory === name
                    ? "bg-ink text-background"
                    : "bg-paper hover:bg-accent"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Nothing published in this category yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pixel-rule" />
      </div>

      {/* Interactive pieces */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pixel-font text-[11px] text-primary">[ Interactive Piece ]</p>
        <a
          href="/pieces/markowitz-portfolio-story.html"
          className="pixel-frame pixel-lift group mt-5 grid gap-0 overflow-hidden md:grid-cols-[280px_1fr]"
        >
          <div className="crt aspect-[16/10] border-b-2 border-ink md:aspect-auto md:border-b-0 md:border-r-2">
            <PixelArt variant="portfolio" className="size-full" />
          </div>
          <div className="flex flex-col justify-center gap-3 p-7 md:p-10">
            <span className="pixel-font text-[10px] text-primary">Markets</span>
            <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
              The Question That Changed the Portfolio
            </h2>
            <p className="font-serif text-lg text-muted-foreground">
              A scrollable visual essay on Harry Markowitz, diversification and the birth of
              modern portfolio theory.
            </p>
            <span className="pixel-font text-[11px]">
              Open the piece <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </span>
          </div>
        </a>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pixel-rule" />
      </div>


      {/* Topics */}
      <section className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
        <h2 className="pixel-font text-sm">Explore by topic</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categories"
              className="pixel-font pixel-panel pixel-lift px-3 py-2 text-[10px]"
            >
              {c.name}
            </Link>
          ))}
        </div>
        <a
          href={SITE.substackUrl}
          target="_blank"
          rel="noreferrer"
          className="pixel-font mt-10 inline-block text-[11px] text-primary underline underline-offset-4"
        >
          Read the latest on Substack →
        </a>
      </section>
    </SiteShell>
  );
}
