export type ArticleStatus =
  | "draft"
  | "ready"
  | "published_web"
  | "exported_substack"
  | "failed";

export type Article = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  pixel_art_image: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  substack_url: string | null;
  substack_post_id: string | null;
  reading_time: number;
  featured: boolean;
  view_count: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
};

export const PUBLIC_STATUSES: ArticleStatus[] = [
  "published_web",
  "exported_substack",
];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Draft",
  ready: "Ready to publish",
  published_web: "Published to website",
  exported_substack: "Exported for Substack",
  failed: "Failed",
};

export const STATUS_SHORT: Record<ArticleStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  published_web: "Website",
  exported_substack: "Exported",
  failed: "Failed",
};

export const ARTICLE_LIST_FIELDS =
  "id,title,slug,subtitle,excerpt,cover_image,pixel_art_image,category,tags,status,published_at,updated_at,reading_time,featured,view_count,substack_url";

export function formatDate(value?: string | null): string {
  if (!value) return "Unpublished";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateReadingTime(content: string): number {
  const text = (content ?? "").replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

