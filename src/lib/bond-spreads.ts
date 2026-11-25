export function tenYearSpreadBps(countryYield: number | undefined, usYield: number | undefined): number | null {
  if (countryYield === undefined || usYield === undefined || !Number.isFinite(countryYield) || !Number.isFinite(usYield)) return null;
  return Math.round((countryYield - usYield) * 100);
}