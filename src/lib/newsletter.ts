// Loads every markdown file in src/content/newsletter/ at build time.
// No Node dependencies (no gray-matter) — parses frontmatter manually so it
// works in the browser bundle without polyfills.

export interface NewsletterPost {
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  slug: string;
  source: string;
  original_post_id: string;
  body: string; // raw markdown, render with react-markdown
}

function parseFrontmatter(raw: string): NewsletterPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Newsletter post missing frontmatter block");
  }
  const [, fm, body] = match;

  const data: Record<string, string> = {};
  fm.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // strip wrapping quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  });

  return {
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    date: data.date ?? "",
    slug: data.slug ?? "",
    source: data.source ?? "",
    original_post_id: data.original_post_id ?? "",
    body: body.trim(),
  };
}

// Eagerly import every .md file in this folder as a raw string.
// Place converted files at: src/content/newsletter/*.md
const modules = import.meta.glob("../content/newsletter/*.md", {
  as: "raw",
  eager: true,
}) as Record<string, string>;

let cachedPosts: NewsletterPost[] | null = null;

export function getAllNewsletterPosts(): NewsletterPost[] {
  if (cachedPosts) return cachedPosts;

  const posts = Object.values(modules).map(parseFrontmatter);
  // newest first
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));

  cachedPosts = posts;
  return posts;
}

export function getNewsletterPostBySlug(slug: string): NewsletterPost | undefined {
  return getAllNewsletterPosts().find((p) => p.slug === slug);
}
