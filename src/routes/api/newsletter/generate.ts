import { createFileRoute } from "@tanstack/react-router";
import { buildHtml, buildMarkdown, type Article } from "@/lib/news-core";

type RequestBody = {
  articles: Article[];
  title?: string;
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
