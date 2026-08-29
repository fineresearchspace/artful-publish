import { createFileRoute } from "@tanstack/react-router";

// Public read-only endpoint: GET /api/public/news?category=India&limit=20
export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get("category") ?? undefined;
        const limitRaw = Number(url.searchParams.get("limit") ?? "24");
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 24;

        try {
          const { loadMarketNews } = await import("@/lib/news/read.server");
          const result = await loadMarketNews(category, limit);
          return Response.json(result, {
            headers: { "cache-control": "public, max-age=300" },
          });
        } catch (error) {
          console.error("[news] api failed", error);
          return Response.json({ news: [], error: "news_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
