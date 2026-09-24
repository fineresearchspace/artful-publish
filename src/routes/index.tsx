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
      { title: "The Context — Ideas worth wondering about" },
      {
        name: "description",
        content:
          "A pixel-art archive of curious ideas about markets, money, business and the world around them.",
      },
      { property: "og:title", content: "The Context — Ideas worth wondering about" },
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
      <section className="border-b border-border bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="pixel-font flex items-center gap-3 text-[10px] text-primary">
              <span className="inline-block h-px w-8 bg-primary" />
            </p>
            <h1 className="display-font mt-6 text-5xl leading-[0.98] text-ink sm:text-7xl">
              Markets, explained&nbsp;
              <br />
              <span className="italic text-primary">in context.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {SITE.tagline}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/articles"
                className="pixel-font inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[10px] text-background transition-opacity hover:opacity-85"
              >
                Read the latest <span aria-hidden="true">→</span>
              </Link>
              <a
                href={SITE.substackSubscribeUrl}
                target="_blank"
                rel="noreferrer"
                className="pixel-font inline-flex items-center gap-2 rounded-full border border-border bg-paper px-6 py-3 text-[10px] text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Newsletter →
              </a>
            </div>
          </div>

          {featured ? (
            <Link
              to="/articles/$slug"
              params={{ slug: featured.slug }}
              className="group rounded-3xl bg-ink p-8 text-background shadow-[0_30px_60px_-30px_rgba(15,32,56,0.6)] transition-transform duration-300 hover:-translate-y-1 sm:p-10"
            >
              <p className="pixel-font text-[10px] text-background/60">This week in brief</p>
              <div className="mt-5 h-px w-full bg-background/20" />
              <p className="pixel-font mt-6 text-[10px] text-background/60">
                {featured.category} · {formatDate(featured.published_at)}
              </p>
              <h2 className="display-font mt-3 text-3xl leading-tight sm:text-4xl">
                {featured.title}
              </h2>
              {featured.subtitle || featured.excerpt ? (
                <p className="mt-4 text-base leading-relaxed text-background/70">
                  {featured.subtitle ?? featured.excerpt}
                </p>
              ) : null}
              <span className="pixel-font mt-8 inline-flex items-center gap-2 text-[10px]">
                Read {featured.reading_time} min{" "}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ) : null}
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
            <div className="crt aspect-[16/10] border-b border-border md:aspect-auto md:border-b-0 md:border-r-2">
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
          <h2 className="display-font text-3xl text-ink">Latest Wonders</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory(name)}
                className={`pixel-font border border-border px-3 py-1.5 text-[10px] transition-colors ${
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
          <div className="crt aspect-[16/10] border-b border-border md:aspect-auto md:border-b-0 md:border-r-2">
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
        <h2 className="display-font text-3xl">Explore by topic</h2>
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
