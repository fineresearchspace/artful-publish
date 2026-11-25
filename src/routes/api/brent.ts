import { createFileRoute } from "@tanstack/react-router";
import { parseTradingEconomicsBrent, type BrentQuote } from "@/lib/brent-quote";

let cache: { at: number; quote: BrentQuote | null } | null = null;

export const Route = createFileRoute("/api/brent")({
  server: {
    handlers: {
      GET: async () => {
        if (!cache || Date.now() - cache.at > 10 * 60 * 1000) {
          let quote: BrentQuote | null = null;
          try {
            const res = await fetch("https://tradingeconomics.com/commodity/brent-crude-oil", {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; TheContext/1.0)" },
            });
            if (res.ok) quote = parseTradingEconomicsBrent(await res.text());
          } catch { quote = null; }
          if (quote || !cache) cache = { at: Date.now(), quote };
        }
        return Response.json({ quote: cache.quote, source: "Trading Economics" }, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
