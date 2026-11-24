/** Parses AMFI monthly report rows (category-wise flows/AUM) from a 2D cell array by header keywords. */
export type AmfiMonthlyRow = { category: string; schemes: number | null; folios: number | null; funds_mobilized_cr: number | null;
  redemption_cr: number | null; net_inflow_cr: number | null; aum_cr: number | null; avg_aum_cr: number | null };
const s = (v: unknown) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
const n = (v: unknown) => { const x = typeof v === "number" ? v : Number(s(v).replace(/,/g, "")); return s(v) !== "" && Number.isFinite(x) ? x : null; };

export function parseAmfiMonthly(rows: unknown[][]): AmfiMonthlyRow[] {
  const h = rows.findIndex((r) => r.some((c) => /no\.? of schemes/i.test(s(c))) && r.some((c) => /folio/i.test(s(c))));
  if (h < 0) return [];
  const head = rows[h]!.map((c) => s(c).toLowerCase());
  const f = (re: RegExp) => head.findIndex((c) => re.test(c));
  const iS = f(/no\.? of schemes/), iF = f(/folio/), iM = f(/mobili/), iR = f(/redemption|repurchase/), iNet = f(/net inflow|net \(inflow|net flow/),
    iAum = f(/net (aum|assets).*(under|as on)|^net aum|net assets under/), iAvg = f(/average/);
  const nameCol = Math.max(0, head.findIndex((c) => /scheme|category/.test(c)));
  const out: AmfiMonthlyRow[] = [];
  for (const r of rows.slice(h + 1)) {
    const name = s(r[nameCol]) || s(r[nameCol + 1]);
    if (!name || /^(sr|total|grand total)/i.test(name) && !/total/i.test(name)) continue;
    const schemes = iS >= 0 ? n(r[iS]) : null;
    if (schemes == null && (iAum < 0 || n(r[iAum]) == null)) continue;
    out.push({ category: name.replace(/^[ivxlc]+\.?\s+|^\d+\.?\s+/i, ""), schemes, folios: iF >= 0 ? n(r[iF]) : null,
      funds_mobilized_cr: iM >= 0 ? n(r[iM]) : null, redemption_cr: iR >= 0 ? n(r[iR]) : null, net_inflow_cr: iNet >= 0 ? n(r[iNet]) : null,
      aum_cr: iAum >= 0 ? n(r[iAum]) : null, avg_aum_cr: iAvg >= 0 ? n(r[iAvg]) : null });
  }
  return out;
}
