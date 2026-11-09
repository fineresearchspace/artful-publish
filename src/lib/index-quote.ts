export type IndexQuote = {
  price: number;
  change: number;
  changePercent: number;
  asOf: string | null;
};

type IndexMetadata = {
  regularMarketPrice?: number;
  fulldayChange?: number;
  fulldayChangePercent?: number;
  regularMarketTime?: number;
};

// Session metadata remains usable even when an index has just one history point.
export function indexSessionQuote(meta?: IndexMetadata): IndexQuote | null {
  const price = meta?.regularMarketPrice;
  const change = meta?.fulldayChange;
  const changePercent = meta?.fulldayChangePercent;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0
    || typeof change !== "number" || !Number.isFinite(change)
    || typeof changePercent !== "number" || !Number.isFinite(changePercent)) return null;
  const timestamp = meta?.regularMarketTime;
  return {
    price, change, changePercent,
    asOf: typeof timestamp === "number" && Number.isFinite(timestamp)
      ? new Date(timestamp * 1000).toISOString() : null,
  };
}