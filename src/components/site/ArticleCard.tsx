import { Link } from "@tanstack/react-router";
import { PixelArt } from "@/components/PixelArt";
import { formatDate } from "@/lib/articles";
import type { ArticleListItem } from "@/lib/public-articles.functions";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link
      to="/articles/$slug"
      params={{ slug: article.slug }}
      className="pixel-frame pixel-lift group flex flex-col overflow-hidden"
    >
      <div className="crt relative aspect-[16/10] overflow-hidden border-b-2 border-ink">
        {article.cover_image ? (
          <img
            src={article.cover_image}
            alt=""
            loading="lazy"
            className="pixelated size-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <PixelArt
            variant={article.pixel_art_image}
            className="size-full transition-transform duration-200 group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="pixel-font text-[10px] text-primary">{article.category}</span>
        <h3 className="font-serif text-xl leading-snug transition-transform duration-150 group-hover:translate-x-1">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
        ) : null}
        <p className="pixel-font mt-auto pt-2 text-[10px] text-muted-foreground">
          {article.reading_time} min read · {formatDate(article.published_at)}
        </p>
        <span className="pixel-font inline-flex items-center gap-2 text-[11px] text-ink">
          Read article <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
