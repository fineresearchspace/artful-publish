/** Parses an AMC "Fund Watch" sheet (e.g. Kotak daily report) given as a 2D array of cells. */
export type FundWatchRow = {
  sheet_category: string; plan: string; scheme_name: string; launch_date: string | null;
  aum_cr: number | null; nav: number | null; avg_maturity_yrs: number | null; ytm: number | null;
  modified_duration: number | null; macaulay_duration: number | null; returns: Record<string, number>;
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && !isNaN(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (v == null ? "" : String(v).trim());
function toDate(v: unknown): string | null {
  if (v instanceof Date && !isNaN(+v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5).toISOString().slice(0, 10);
  return null;
}
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
/** "(As on October 15,2026)" → 2026-10-15 */
export function parseAsOf(text: string): string | null {
  const m = text.toLowerCase().match(/([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/); if (!m) return null;
  const mi = MONTHS.indexOf(m[1]!); if (mi < 0) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[2]!.padStart(2, "0")}`;
}

export function parseFundWatchSheet(name: string, rows: unknown[][]): { asOf: string | null; rows: FundWatchRow[] } {
  let asOf: string | null = null; const out: FundWatchRow[] = [];
  const h = rows.findIndex((r) => r.some((c) => str(c) === "Launch Date"));
  for (const r of rows.slice(0, Math.max(h, 0) + 1)) { const t = r.map(str).join(" "); if (/as on/i.test(t)) asOf = parseAsOf(t) ?? asOf; }
  if (h < 0) return { asOf, rows: out };
  const head = rows[h]!.map(str), sub = (rows[h + 1] ?? []).map(str);
  const col = (label: string, arr = head) => arr.findIndex((c) => c.toLowerCase().startsWith(label.toLowerCase()));
  const iL = col("Launch Date"), iA = col("AUM"), iN = col("NAV");
  const iM = col("Avg Maturity", sub), iY = col("YTM", sub), iMD = col("Modified", sub), iMC = col("Macaulay", sub);
  const periods = head.map((c, i) => [c, i] as const).filter(([c]) => /^\d+\s+(day|days|month|months|year|years)$/i.test(c));
  let plan = "Direct";
  for (const r of rows.slice(h + 2)) {
    const first = str(r[0]); if (!first) continue;
    if (/regular plan/i.test(first)) { plan = "Regular"; continue; }
    if (/direct plan/i.test(first)) { plan = "Direct"; continue; }
    const launch = toDate(r[iL]);
    if (!launch && num(r[iA]) == null) continue;
    const returns: Record<string, number> = {};
    for (const [label, i] of periods) { const v = num(r[i]); if (v != null) returns[label.toLowerCase()] = v; }
    const g = (i: number) => (i >= 0 ? num(r[i]) : null);
    out.push({ sheet_category: name, plan, scheme_name: first, launch_date: launch, aum_cr: g(iA), nav: g(iN),
      avg_maturity_yrs: g(iM), ytm: g(iY), modified_duration: g(iMD), macaulay_duration: g(iMC), returns });
  }
  return { asOf, rows: out };
}
