import { createFileRoute } from "@tanstack/react-router";

type ChatArticle = {
  title: string;
  summary?: string;
  source: string;
  sourceUrl: string;
  publishedAt?: string;
  category?: string;
};

type ChatBody = {
  question?: string;
  articles?: ChatArticle[];
};

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are the Weekly Wonders market news assistant.

Answer ONLY using the article set provided in the user message (headlines, summaries, sources).
Rules:
- Never invent facts, numbers, or stories that are not in the article set.
- Cite the article(s) you draw from by headline and source, e.g. (Reuters — "Fed signals rate cut").
- If the current news set does not cover the question, say plainly that the loaded news set does not cover it.
- Be concise: 2-5 short sentences or a tight bullet list. No preamble.`;

const formatArticles = (articles: ChatArticle[]) =>
  articles
    .slice(0, 40)
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" — ${a.source}${a.category ? ` [${a.category}]` : ""}${
          a.publishedAt ? ` (${a.publishedAt})` : ""
        }\n   ${a.summary?.slice(0, 400) ?? ""}\n   ${a.sourceUrl}`,
    )
    .join("\n\n");

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["ANTHROPIC_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "Chat is not configured yet (missing ANTHROPIC_API_KEY)." },
            { status: 503 },
          );
        }

        let body: ChatBody;
        try {
          body = (await request.json()) as ChatBody;
        } catch {
          return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        const question = body.question?.trim();
        if (!question) {
          return Response.json({ error: "A question is required." }, { status: 400 });
        }

        let articles = Array.isArray(body.articles) ? body.articles : [];
        if (articles.length === 0) {
          // Fall back to the current server-side news set.
          try {
            const res = await fetch(new URL("/api/news?limit=30", request.url));
            if (res.ok) {
              const data = (await res.json()) as { items?: ChatArticle[] };
              articles = data.items ?? [];
            }
          } catch {
            /* fall through with an empty set */
          }
        }

        if (articles.length === 0) {
          return Response.json({
            answer: "No news is currently loaded, so I can't answer questions about it yet.",
          });
        }

        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 700,
              system: SYSTEM_PROMPT,
              messages: [
                {
                  role: "user",
                  content: `Current news set:\n\n${formatArticles(articles)}\n\nQuestion: ${question}`,
                },
              ],
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!res.ok) {
            const detail = await res.text();
            console.error("[/api/chat] Anthropic error", res.status, detail.slice(0, 500));
            const message =
              res.status === 429
                ? "The assistant is rate limited right now. Try again in a moment."
                : res.status === 401
                  ? "The assistant's API key is invalid."
                  : "The assistant couldn't answer right now.";
            return Response.json({ error: message }, { status: res.status });
          }

          const data = (await res.json()) as {
            content?: { type: string; text?: string }[];
          };
          const answer =
            data.content
              ?.filter((part) => part.type === "text")
              .map((part) => part.text ?? "")
              .join("\n")
              .trim() || "No answer returned.";

          return Response.json({ answer });
        } catch (err) {
          console.error("[/api/chat] failed:", err);
          return Response.json({ error: "The assistant couldn't answer right now." }, { status: 500 });
        }
      },
    },
  },
});
