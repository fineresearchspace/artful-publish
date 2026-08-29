import { createFileRoute } from "@tanstack/react-router";

// Scheduled refresh endpoint. Call with:
//   Authorization: Bearer <NEWS_CRON_SECRET>
export const Route = createFileRoute("/api/public/news-refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["NEWS_CRON_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const auth = request.headers.get("authorization") ?? "";
        if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

        try {
          const { refreshMarketNews } = await import("@/lib/news/ingest.server");
          const result = await refreshMarketNews();
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("[news] scheduled refresh failed", error);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
