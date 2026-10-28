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
    const response = await fetch("/api/market-history?symbol=BZ%3DF&range=1m", { signal });
    if (!response.ok) return null;
    const payload = await response.json() as { quote?: BrentQuote | null };
    return payload.quote ?? null;
  } catch (error) {
    if (signal.aborted) throw error;
    return null;
  }
}