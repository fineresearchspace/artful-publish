import { createFileRoute } from "@tanstack/react-router";
import type { Article } from "../../../api/lib/news-core";

type RequestBody = {
  articles: Article[];
  title?: string;
};

const buildMarkdown = (title: string, articles: Article[]) => {
  const grouped = new Map<string, Article[]>();
  articles.forEach((a) => grouped.set(a.category, [...(grouped.get(a.category) ?? []), a]));

  const lines = [`# ${title}`, "", "A focused briefing of today's most relevant finance stories.", ""];
  for (const [category, items] of grouped) {
    lines.push(`## ${category}`, "");
    items.forEach((a, i) => {
      lines.push(
        `### ${i + 1}. ${a.title}`,
        "",
        a.summary,
        "",
        `**Source:** ${a.source} · **Impact:** ${a.impactLabel}`,
        "",
        `[Read Original Article →](${a.sourceUrl})`,
        ""
      );
    });
  }
  return lines.join("\n");
};

const buildHtml = (title: string, articles: Article[]) => {
  const grouped = new Map<string, Article[]>();
  articles.forEach((a) => grouped.set(a.category, [...(grouped.get(a.category) ?? []), a]));

  const sections = [...grouped.entries()].map(([category, items]) => `
    <section>
      <h2>${category}</h2>
      ${items.map((a) => `
        <article>
          <h3>${a.title}</h3>
          <p>${a.summary}</p>
          <p><strong>${a.source}</strong> · ${a.impactLabel}</p>
          <a href="${a.sourceUrl}" rel="noreferrer">Read Original Article →</a>
        </article>
      `).join("")}
    </section>
  `).join("");

  return `<article><h1>${title}</h1>${sections}</article>`;
};

export const Route = createFileRoute("/api/newsletter/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: RequestBody;
        try {
          body = (await request.json()) as RequestBody;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (!body?.articles || !Array.isArray(body.articles) || body.articles.length === 0) {
          return Response.json(
            { error: "Request body must include a non-empty 'articles' array." },
            { status: 400 },
          );
        }

        const title = body.title?.trim() || "Daily Wonder";

        return Response.json({
          title,
          generatedAt: new Date().toISOString(),
          articleCount: body.articles.length,
          markdown: buildMarkdown(title, body.articles),
          html: buildHtml(title, body.articles),
        });
      },
    },
  },
});
