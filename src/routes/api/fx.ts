import { createFileRoute } from "@tanstack/react-router";

// Frankfurter: free, no API key, ECB reference rates.
const API = "https://api.frankfurter.dev/v2";
const CACHE_MS = 5 * 60_000;

type RatePair = {
  pair: string;
  rate: number;
  previous: number | null;
  changePct: number | null;
};

type FxPayload = { pairs: RatePair[]; asOf: string; previousDate: string | null };

let cache: { at: number; payload: FxPayload } | null = null;

const fetchRates = async (path: string) => {
  const res = await fetch(`${API}/${path}?base=USD&symbols=INR,JPY,EUR,GBP`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  return (await res.json()) as { date: string; base: string; rates: Record<string, number> };
};

const derive = (r: Record<string, number>) => {
  const inr = r["INR"];
  const jpy = r["JPY"];
  const eur = r["EUR"];
  const gbp = r["GBP"];
  const out: Record<string, number> = {};
  if (inr) out["USD/INR"] = inr;
  if (jpy) out["USD/JPY"] = jpy;
  if (eur) out["EUR/USD"] = 1 / eur;
  if (gbp) out["GBP/USD"] = 1 / gbp;
  if (eur && inr) out["EUR/INR"] = inr / eur;
  return out;
};

const ORDER = ["USD/INR", "EUR/USD", "GBP/USD", "USD/JPY", "EUR/INR"];

export const Route = createFileRoute("/api/fx")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && Date.now() - cache.at < CACHE_MS) {
          return Response.json(cache.payload, {
            headers: { "cache-control": "s-maxage=300, stale-while-revalidate=600" },
          });
        }

        try {
          const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
          const [latest, prior] = await Promise.all([
            fetchRates("latest"),
            fetchRates(yesterday).catch(() => null),
          ]);

          const current = derive(latest.rates);
          const previous = prior ? derive(prior.rates) : {};

          const pairs: RatePair[] = ORDER.filter((p) => current[p] !== undefined).map((pair) => {
            const rate = current[pair] as number;
            const prev = previous[pair] ?? null;
            return {
              pair,
              rate: Number(rate.toFixed(4)),
              previous: prev === null ? null : Number(prev.toFixed(4)),
              changePct: prev ? Number((((rate - prev) / prev) * 100).toFixed(2)) : null,
            };
          });

          const payload: FxPayload = {
            pairs,
            asOf: latest.date,
            previousDate: prior?.date ?? null,
          };
          cache = { at: Date.now(), payload };

          return Response.json(payload, {
            headers: { "cache-control": "s-maxage=300, stale-while-revalidate=600" },
          });
        } catch (err) {
          console.error("[/api/fx] failed:", err);
          if (cache) return Response.json(cache.payload);
          return Response.json({ error: "Failed to fetch currency rates" }, { status: 502 });
        }
      },
    },
  },
});
