import { createFileRoute } from "@tanstack/react-router";

// US Treasury par yield curve — free, no API key, updated each business day.
const FEED =
  "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=";
const CACHE_MS = 30 * 60_000;

type BondRate = { label: string; yield: number; previous: number | null; changeBps: number | null };
type BondPayload = { rates: BondRate[]; asOf: string; previousDate: string | null };

let cache: { at: number; payload: BondPayload } | null = null;

const FIELDS: Array<{ tag: string; label: string }> = [
  { tag: "BC_3MONTH", label: "US 3M" },
  { tag: "BC_2YEAR", label: "US 2Y" },
  { tag: "BC_5YEAR", label: "US 5Y" },
  { tag: "BC_10YEAR", label: "US 10Y" },
  { tag: "BC_30YEAR", label: "US 30Y" },
];

type Row = { date: string; values: Record<string, number> };

function parseFeed(xml: string): Row[] {
  const rows: Row[] = [];
  const entries = xml.split("<m:properties>").slice(1);
  for (const chunk of entries) {
    const dateMatch = chunk.match(/<d:NEW_DATE[^>]*>([^<]+)</);
    if (!dateMatch) continue;
    const values: Record<string, number> = {};
    for (const { tag } of FIELDS) {
      const m = chunk.match(new RegExp(`<d:${tag}[^>]*>([^<]+)<`));
      const n = m ? Number(m[1]) : NaN;
      if (Number.isFinite(n)) values[tag] = n;
    }
    rows.push({ date: (dateMatch[1] ?? "").slice(0, 10), values });
  }
  return rows;
}

async function fetchYear(year: number): Promise<Row[]> {
  const res = await fetch(`${FEED}${year}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Treasury HTTP ${res.status}`);
  return parseFeed(await res.text());
}

export const Route = createFileRoute("/api/bonds")({
  server: {
    handlers: {
      GET: async () => {
        if (cache && Date.now() - cache.at < CACHE_MS) {
          return Response.json(cache.payload, {
            headers: { "cache-control": "s-maxage=1800, stale-while-revalidate=3600" },
          });
        }

        try {
          const now = new Date();
          let rows = await fetchYear(now.getUTCFullYear());
          // Early January: the current-year feed can be empty or hold one row.
          if (rows.length < 2) {
            const prior = await fetchYear(now.getUTCFullYear() - 1).catch(() => []);
            rows = [...prior, ...rows];
          }
          rows.sort((a, b) => a.date.localeCompare(b.date));
          const latest = rows[rows.length - 1];
          const previous = rows[rows.length - 2] ?? null;
          if (!latest) throw new Error("No yield rows returned");

          const rates: BondRate[] = FIELDS.filter((f) => latest.values[f.tag] !== undefined).map(
            (f) => {
              const y = latest.values[f.tag] as number;
              const prev = previous?.values[f.tag] ?? null;
              return {
                label: f.label,
                yield: Number(y.toFixed(2)),
                previous: prev === null ? null : Number(prev.toFixed(2)),
                changeBps: prev === null ? null : Math.round((y - prev) * 100),
              };
            },
          );

          const payload: BondPayload = {
            rates,
            asOf: latest.date,
            previousDate: previous?.date ?? null,
          };
          cache = { at: Date.now(), payload };

          return Response.json(payload, {
            headers: { "cache-control": "s-maxage=1800, stale-while-revalidate=3600" },
          });
        } catch (err) {
          console.error("[/api/bonds] failed:", err);
          if (cache) return Response.json(cache.payload);
          return Response.json({ error: "Failed to fetch bond yields" }, { status: 502 });
        }
      },
    },
  },
});
