import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { ArticleCard } from "@/components/site/ArticleCard";
import { PixelArt } from "@/components/PixelArt";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/articles";
import {
  getPublishedArticle,
  registerArticleView,
} from "@/lib/public-articles.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params }) => {
    const result = await getPublishedArticle({ data: { slug: params.slug } });
    if (!result.article) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData?.article) {
      return {
        meta: [
          { title: "Article not found — Weekly Wonders" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const a = loaderData.article;
    const description = a.excerpt || a.subtitle || SITE.tagline;
    return {
      meta: [
        { title: `${a.title} — Weekly Wonders` },
        { name: "description", content: description },
        { property: "og:title", content: a.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/articles/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/articles/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description,
            datePublished: a.published_at,
            dateModified: a.updated_at,
            articleSection: a.category,
            keywords: (a.tags ?? []).join(", "),
            author: { "@type": "Person", name: "Weekly Wonders" },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="pixel-font text-xl">Wonder not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This article may have been unpublished or moved.
        </p>
        <Link to="/articles" className="pixel-font mt-8 inline-block text-[11px] text-primary">
          Back to the archive →
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <p className="p-16 text-center text-sm text-muted-foreground">
        This article could not be loaded.
      </p>
    </SiteShell>
  ),
});

function ArticlePage() {
  const { article, related } = Route.useLoaderData();
  const { slug } = Route.useParams();

  useEffect(() => {
    void registerArticleView({ data: { slug } });
  }, [slug]);

  if (!article) return null;

  return (
    <SiteShell>
      <article>
        <header className="border-b-2 border-ink bg-paper">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <Link to="/articles" className="pixel-font text-[10px] text-muted-foreground">
              ← Archive
            </Link>
            <p className="pixel-font mt-6 text-[11px] text-primary">{article.category}</p>
            <h1 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
              {article.title}
            </h1>
            {article.subtitle ? (
              <p className="mt-4 font-serif text-xl text-muted-foreground">{article.subtitle}</p>
            ) : null}
            <p className="pixel-font mt-6 text-[10px] text-muted-foreground">
              {formatDate(article.published_at)} · {article.reading_time} min read
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="crt pixel-frame mt-10 aspect-[16/7] overflow-hidden">
            {article.cover_image ? (
              <img
                src={article.cover_image}
                alt={article.title}
                className="pixelated size-full object-cover"
              />
            ) : (
              <PixelArt variant={article.pixel_art_image} className="size-full" />
            )}
          </div>

          <Markdown content={article.content} className="mt-10" />

          {article.tags?.length ? (
            <div className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="pixel-font pixel-panel px-2 py-1 text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {article.substack_url ? (
            <a
              href={article.substack_url}
              target="_blank"
              rel="noreferrer"
              className="pixel-frame-sm pixel-lift pixel-font mt-10 inline-block bg-accent px-4 py-3 text-[11px] text-accent-foreground"
            >
              Read this on Substack →
            </a>
          ) : null}

          <div className="pixel-rule mt-14" />
        </div>

        {related.length ? (
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="pixel-font text-sm">Related wonders</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </SiteShell>
  );
}
