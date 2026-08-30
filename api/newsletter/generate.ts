import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Article } from "../lib/news-core";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as RequestBody;
  if (!body?.articles || !Array.isArray(body.articles) || body.articles.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'articles' array." });
  }

  const title = body.title?.trim() || "Daily Wonder";
  const generatedAt = new Date().toISOString();

  return res.status(200).json({
    title,
    generatedAt,
    articleCount: body.articles.length,
    markdown: buildMarkdown(title, body.articles),
    html: buildHtml(title, body.articles),
  });
}
