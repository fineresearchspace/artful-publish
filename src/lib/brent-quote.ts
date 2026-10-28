type QuoteMeta = {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  fulldayChange?: number;
  fulldayChangePercent?: number;
  regularMarketChangePercent?: number;
};

export type BrentQuote = { price: number; change: number; changePercent: number; asOf: string };

// Futures history can cross a contract roll. Use the provider's session change,
// never yesterday's continuous-history close, as the daily-change reference.
export function brentSessionQuote(meta: QuoteMeta | undefined): BrentQuote | null {
  const price = meta?.regularMarketPrice;
  const change = meta?.fulldayChange;
  const changePercent = meta?.fulldayChangePercent ?? meta?.regularMarketChangePercent;
  const time = meta?.regularMarketTime;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
      typeof change !== "number" || !Number.isFinite(change) ||
      typeof changePercent !== "number" || !Number.isFinite(changePercent) ||
      typeof time !== "number" || !Number.isFinite(time)) return null;
  const date = new Date(time * 1000);
  if (!Number.isFinite(date.getTime())) return null;
  return { price, change, changePercent, asOf: date.toISOString() };
}

export async function fetchBrentQuote(signal: AbortSignal): Promise<BrentQuote | null> {
  try {
    const response = await fetch("/api/brent", { signal });
    if (!response.ok) return null;
    const payload = await response.json() as { quote?: BrentQuote | null };
    return payload.quote ?? null;
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }
}
// Parses Trading Economics' Brent summary sentence, e.g.
// "Brent rose to 115.95 USD/Bbl on October 28, 2026, up 1.82% from the previous day."
export function parseTradingEconomicsBrent(html: string): BrentQuote | null {
  const m = html.match(/Brent (?:rose|fell|increased|decreased|traded|was)[^0-9]{0,20}([\d,]+(?:\.\d+)?) USD\/Bbl on ([A-Z][a-z]+ \d{1,2}, \d{4}),? (up|down) ([\d.]+)% from the previous day/);
  if (!m) return null;
  const price = Number(m[1].replace(/,/g, ""));
  const pct = Number(m[4]) * (m[3] === "down" ? -1 : 1);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(pct)) return null;
  const previous = price / (1 + pct / 100);
  const date = new Date(`${m[2]} UTC`);
  return {
    price,
    change: Math.round((price - previous) * 100) / 100,
    changePercent: pct,
    asOf: Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString(),
  };
}
