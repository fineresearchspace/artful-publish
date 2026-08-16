import { renderMarkdown } from "@/components/Markdown";
import type { Article } from "@/lib/articles";
import type { PublishingProvider } from "./types";

/**
 * Substack does NOT publish an official, documented public API for creating or
 * publishing posts. Substack's public surface is limited to its RSS feed
 * (https://<publication>.substack.com/feed) and its own import tools; the
 * endpoints used by substack.com itself are private and unsupported.
 *
 * Therefore this provider deliberately reports `canPublish: false` and ships a
 * fully working export/copy workflow instead of a fabricated integration.
 * If Substack ever ships an official API, only this file needs to change.
 */
export const substackProvider: PublishingProvider = {
  id: "substack",
  name: "Substack",
  capabilities: {
    canPublish: false,
    canUpdate: false,
    canSync: false,
    canExport: true,
  },
  statusNote:
    "Substack has no official public publishing API. Weekly Wonders therefore uses a one-click export/copy workflow — the article is prepared so it can be pasted into the Substack editor with essentially no cleanup. The integration slot is wired and ready if an official API appears.",

  exportPost(article: Article) {
    const frontMatterless = article.content.trim();
    const markdown = [
      `# ${article.title}`,
      article.subtitle ? `### ${article.subtitle}` : "",
      "",
      frontMatterless,
      "",
      article.tags?.length ? `\n---\nTags: ${article.tags.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const html = [
      `<h1>${escapeHtml(article.title)}</h1>`,
      article.subtitle ? `<h3>${escapeHtml(article.subtitle)}</h3>` : "",
      renderMarkdown(frontMatterless),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      markdown,
      html,
      title: article.title,
      subtitle: article.subtitle,
      excerpt: article.excerpt,
      tags: (article.tags ?? []).join(", "),
    };
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const publishingProviders = [substackProvider];
