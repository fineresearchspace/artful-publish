// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import type { Article } from "./src/lib/news-core";

// The repo root also contains Vercel-style serverless functions under /api
// (api/news.ts, api/health.ts, api/newsletter/generate.ts). In the Vite dev
// server those files would be served as raw transpiled source at /api/*,
// shadowing the same-origin TanStack server routes. This dev-only middleware
// answers those paths itself using the shared news core, so the frontend's
// /api/* fetches behave identically in dev, preview, and on Vercel.
function vercelApiShim(): Plugin {
  return {
    name: "vercel-api-shim",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        if (url !== "/api/news" && url !== "/api/newsletter/generate" && url !== "/api/health") {
          return next();
        }

        const core = await import("./src/lib/news-core");

        if (url === "/api/health") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ status: "ok" }));
          return;
        }

        if (url === "/api/newsletter/generate") {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              articles?: core.Article[];
              title?: string;
            };
            if (!body.articles || body.articles.length === 0) throw new Error("empty");
            const title = body.title?.trim() || "Daily Wonder";
            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                title,
                generatedAt: new Date().toISOString(),
                articleCount: body.articles.length,
                markdown: core.buildMarkdown(title, body.articles),
                html: core.buildHtml(title, body.articles),
              }),
            );
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Request body must include a non-empty 'articles' array." }));
          }
          return;
        }

        // /api/news
        const DEFAULT_RSS = [
          "Reuters|https://news.google.com/rss/search?q=when:2d+reuters.com+markets&hl=en-US&gl=US&ceid=US:en",
          "CNBC|https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
          "Yahoo Finance|https://finance.yahoo.com/news/rssindex",
          "The Economic Times|https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
          "Business Standard|https://www.business-standard.com/rss/markets-106.rss",
        ].join(",");
        const rssConfig = process.env["NEWS_RSS_URLS"] || DEFAULT_RSS;
        const params = new URL(req.url ?? "", "http://localhost").searchParams;

        try {
          const { articles, failedSources, sourcesTotal } = await core.fetchAndProcessNews(rssConfig, {
            category: params.get("category") ?? undefined,
            source: params.get("source") ?? undefined,
            search: params.get("search") ?? undefined,
            minImpact: params.get("minImpact") ? Number(params.get("minImpact")) : undefined,
          });
          const pageNum = Math.max(1, Number(params.get("page") ?? "1"));
          const limitNum = Math.min(100, Math.max(1, Number(params.get("limit") ?? "30")));
          const start = (pageNum - 1) * limitNum;
          res.setHeader("content-type", "application/json");
          res.setHeader("cache-control", "s-maxage=300, stale-while-revalidate=600");
          res.end(
            JSON.stringify({
              items: articles.slice(start, start + limitNum),
              total: articles.length,
              page: pageNum,
              limit: limitNum,
              sourcesTotal,
              sourcesFailed: failedSources,
            }),
          );
        } catch (error) {
          console.error("[/api/news] dev shim failed:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch news" }));
        }
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [vercelApiShim()],
  },
});
