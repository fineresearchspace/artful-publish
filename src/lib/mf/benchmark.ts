import { navOnOrBefore, type NavPoint } from "./returns";
const t = (d: string) => Date.parse(d + "T00:00:00Z");
/** Rolling CAGR of fund vs benchmark on common dates; beat% = share of windows where fund outperformed. */
export function rollingVsBenchmark(fund: NavPoint[], bench: NavPoint[], years: number) {
  const days = Math.round(years * 365) * 864e5; const diffs: number[] = []; let fSum = 0, bSum = 0;
  for (const p of fund) {
    const f0 = navOnOrBefore(fund, t(p.date) - days), b1 = navOnOrBefore(bench, t(p.date)), b0 = navOnOrBefore(bench, t(p.date) - days);
    if (!f0 || !b1 || !b0 || t(p.date) - t(f0.date) < days - 7 * 864e5 || t(p.date) - t(b0.date) < days - 7 * 864e5 || t(p.date) - t(b1.date) > 7 * 864e5) continue;
    const fr = (Math.pow(p.nav / f0.nav, 1 / years) - 1) * 100, br = (Math.pow(b1.nav / b0.nav, 1 / years) - 1) * 100;
    diffs.push(fr - br); fSum += fr; bSum += br;
  }
  if (!diffs.length) return null;
  const c = diffs.length;
  return { windows: c, fundAvg: fSum / c, benchAvg: bSum / c, excessAvg: (fSum - bSum) / c, beatPct: (diffs.filter((d) => d > 0).length / c) * 100,
    worstExcess: Math.min(...diffs), bestExcess: Math.max(...diffs) };
}
