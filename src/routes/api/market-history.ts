import { createFileRoute } from "@tanstack/react-router";

const INDEX_SYMBOLS = {
  nifty50: "^NSEI",
  sensex: "^BSESN",
  banknifty: "^NSEBANK",
  sp500: "^GSPC",
  nasdaq100: "^NDX",
  dow: "^DJI",
  nikkei225: "^N225",
  dax: "^GDAXI",
  ftse100: "^FTSE",
  "^NSEI": "^NSEI",
  "^NSMIDCP": "^NSMIDCP",
  "^NSEMDCP50": "^NSEMDCP50",
  "^CRSLDX": "^CRSLDX",
  "^BSESN": "^BSESN",
  "^NSEBANK": "^NSEBANK",
  "^CNXIT": "^CNXIT",
  "^CNXAUTO": "^CNXAUTO",
  "^CNXPHARMA": "^CNXPHARMA",
  "^INDIAVIX": "^INDIAVIX",
  "^GSPC": "^GSPC",
  "^NDX": "^NDX",
  "^DJI": "^DJI",
  "^RUT": "^RUT",
  "^VIX": "^VIX",
  "^STOXX50E": "^STOXX50E",
  "^FTSE": "^FTSE",
  "^GDAXI": "^GDAXI",
  "^N225": "^N225",
  "^KS11": "^KS11",
  "^HSI": "^HSI",
  "GC=F": "GC=F",
  "SI=F": "SI=F",
  "BZ=F": "BZ=F",
  "CL=F": "CL=F",
  "NG=F": "NG=F",
  "EURUSD=X": "EURUSD=X",
  "GBPUSD=X": "GBPUSD=X",
  "USDJPY=X": "USDJPY=X",
  "USDINR=X": "USDINR=X",
  "EURINR=X": "EURINR=X",
} as const;

const RANGES = {
  "1m": { range: "1mo", interval: "1d" },
  "3m": { range: "3mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
} as const;

type IndexKey = keyof typeof INDEX_SYMBOLS;
type RangeKey = keyof typeof RANGES;
type HistoryPoint = { date: string; price: number; volume: number | null };
type HistoryPayload = { symbol: IndexKey; range: RangeKey; currency: string; points: HistoryPoint[] };

const CACHE_MS = 15 * 60_000;
const cache = new Map<string, { at: number; payload: HistoryPayload }>();

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: { currency?: string };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null>; volume?: Array<number | null> }> };
    }>;
  };
};

export const Route = createFileRoute("/api/market-history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const symbol = url.searchParams.get("symbol") ?? "nifty50";
        const range = url.searchParams.get("range") ?? "1y";

        if (!(symbol in INDEX_SYMBOLS) || !(range in RANGES)) {
          return Response.json({ error: "Unsupported index or range" }, { status: 400 });
        }

        const indexKey = symbol as IndexKey;
        const rangeKey = range as RangeKey;
        const cacheKey = `${indexKey}:${rangeKey}`;
        const cached = cache.get(cacheKey);
        const headers = { "cache-control": "s-maxage=900, stale-while-revalidate=1800" };
        if (cached && Date.now() - cached.at < CACHE_MS) {
          return Response.json(cached.payload, { headers });
        }

        const query = RANGES[rangeKey];
        const yahooSymbol = INDEX_SYMBOLS[indexKey];
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${query.range}&interval=${query.interval}&events=history`,
            {
              headers: { "user-agent": "Mozilla/5.0" },
              signal: AbortSignal.timeout(10_000),
            },
          );
          if (!response.ok) throw new Error(`Historical feed HTTP ${response.status}`);

          const body = (await response.json()) as YahooChart;
          const result = body.chart?.result?.[0];
          const timestamps = result?.timestamp ?? [];
          const quote = result?.indicators?.quote?.[0];
          const closes = quote?.close ?? [];
          const volumes = quote?.volume ?? [];
          const points = timestamps.flatMap((timestamp, index) => {
            const price = closes[index];
            if (typeof price !== "number" || !Number.isFinite(price)) return [];
            const volume = volumes[index];
            return [{
              date: new Date(timestamp * 1000).toISOString().slice(0, 10),
              price: Number(price.toFixed(2)),
              volume: typeof volume === "number" && Number.isFinite(volume) ? volume : null,
            } satisfies HistoryPoint];
          });
          if (points.length === 0) throw new Error("Historical feed returned no prices");

          const payload: HistoryPayload = {
            symbol: indexKey,
            range: rangeKey,
            currency: result?.meta?.currency ?? "",
            points,
          };
          cache.set(cacheKey, { at: Date.now(), payload });
          return Response.json(payload, { headers });
        } catch (error) {
          console.error("[/api/market-history] failed:", error);
          if (cached) return Response.json(cached.payload, { headers });
          return Response.json({ error: "Historical index data is temporarily unavailable" }, { status: 502 });
        }
      },
    },
  },
});