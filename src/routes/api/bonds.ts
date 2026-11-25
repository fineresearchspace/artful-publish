import { createFileRoute } from "@tanstack/react-router";

// Live government bond yields (2Y / 10Y / 30Y) for major economies.
// Source: worldgovernmentbonds.com public JSON endpoint — free, no API key.
const ENDPOINT = "https://www.worldgovernmentbonds.com/wp-json/country/v1/main";
const CACHE_MS = 30 * 60_000;

const COUNTRIES: Array<{ symbol: string; name: string; slug: string; flag: string }> = [
  { symbol: "8", name: "India", slug: "india", flag: "in" },
  { symbol: "6", name: "United States", slug: "united-states", flag: "us" },
  { symbol: "2", name: "Germany", slug: "germany", flag: "de" },
  { symbol: "5", name: "United Kingdom", slug: "united-kingdom", flag: "gb" },
  { symbol: "11", name: "Japan", slug: "japan", flag: "jp" },
  { symbol: "9", name: "China", slug: "china", flag: "cn" },
];

const MATURITIES = ["2-years", "10-years", "30-years"] as const;
type MaturityKey = "2Y" | "10Y" | "30Y";
const LABELS: Record<(typeof MATURITIES)[number], MaturityKey> = {
  "2-years": "2Y",
  "10-years": "10Y",
  "30-years": "30Y",
};

type Point = { yield: number; changeBps: number | null };
type CountryBonds = {
  country: string;
  flag: string;
  rates: Partial<Record<MaturityKey, Point>>;
};
type BondPayload = { countries: CountryBonds[]; asOf: string };

let cache: { at: number; payload: BondPayload } | null = null;

function parseCurveTable(html: string, slug: string): CountryBonds["rates"] {
  const rates: CountryBonds["rates"] = {};
  for (const row of html.split("<tr").slice(1)) {
    const m = row.match(
      new RegExp(`bond-historical-data/${slug}/([0-9]+-(?:year|years|month|months))/`),
    );
    if (!m) continue;
    const key = LABELS[(m[1] ?? "") as (typeof MATURITIES)[number]];
    if (!key || rates[key]) continue;
    const y = row.match(/([0-9]+\.[0-9]+)%/);
    if (!y) continue;
    const bp = row.match(/([+-][0-9]+(?:\.[0-9]+)?)\s*bp/);
    rates[key] = {
      yield: Number(Number(y[1]).toFixed(2)),
      changeBps: bp ? Math.round(Number(bp[1])) : null,
    };
  }
  return rates;
}

async function fetchCountry(c: (typeof COUNTRIES)[number]) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://www.worldgovernmentbonds.com",
      referer: `https://www.worldgovernmentbonds.com/country/${c.slug}/`,
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      GLOBALVAR: {
        JS_VARIABLE: "jsGlobalVars",
        FUNCTION: "Country",
        DOMESTIC: true,
        ENDPOINT: "https://www.worldgovernmentbonds.com/wp-json/country/v1/historical",
        DATE_RIF: "2099-12-31",
        OBJ: null,
        COUNTRY1: {
          SYMBOL: c.symbol,
          PAESE: c.name,
          PAESE_UPPERCASE: c.name.toUpperCase(),
          BANDIERA: c.flag,
          URL_PAGE: c.slug,
        },
        COUNTRY2: null,
        OBJ1: null,
        OBJ2: null,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`WGB HTTP ${res.status}`);
  const data = (await res.json()) as { mainTable?: string; lastDataValDesc?: string };
  return {
    entry: {
      country: c.name,
      flag: c.flag,
      rates: parseCurveTable(data.mainTable ?? "", c.slug),
    } satisfies CountryBonds,
    asOf: data.lastDataValDesc ?? "",
  };
}

export const Route = createFileRoute("/api/bonds")({
  server: {
    handlers: {
      GET: async () => {
        const headers = {
          "cache-control": "s-maxage=1800, stale-while-revalidate=3600",
        };
        if (cache && Date.now() - cache.at < CACHE_MS) {
          return Response.json(cache.payload, { headers });
        }

        try {
          const results = await Promise.allSettled(COUNTRIES.map(fetchCountry));
          const countries: CountryBonds[] = [];
          let asOf = "";
          for (const r of results) {
            if (r.status !== "fulfilled") continue;
            if (Object.keys(r.value.entry.rates).length === 0) continue;
            countries.push(r.value.entry);
            if (!asOf) asOf = r.value.asOf;
          }
          if (countries.length === 0) throw new Error("No bond rows returned");

          const payload: BondPayload = { countries, asOf };
          cache = { at: Date.now(), payload };
          return Response.json(payload, { headers });
        } catch (err) {
          console.error("[/api/bonds] failed:", err);
          if (cache) return Response.json(cache.payload);
          return Response.json({ error: "Failed to fetch bond yields" }, { status: 502 });
        }
      },
    },
  },
});
