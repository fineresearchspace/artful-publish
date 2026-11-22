/** Pure return/risk engine for NAV series (ascending by date). Percent outputs. */
export type NavPoint = { date: string; nav: number };
const DAY = 864e5;
const t = (d: string) => Date.parse(d + "T00:00:00Z");

/** NAV on or before the target date (binary search). */
export function navOnOrBefore(s: NavPoint[], target: number): NavPoint | null {
  let lo = 0, hi = s.length - 1, best = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (t(s[m]!.date) <= target) { best = m; lo = m + 1; } else hi = m - 1; }
  return best >= 0 ? s[best]! : null;
}

/** Absolute return for periods < 1y, CAGR for >= 1y. Null if history too short. */
export function periodReturn(s: NavPoint[], days: number): number | null {
  const last = s[s.length - 1]; if (!last) return null;
  const target = t(last.date) - days * DAY;
  if (t(s[0]!.date) > target + 7 * DAY) return null;
  const start = navOnOrBefore(s, target) ?? s[0]!;
  const ratio = last.nav / start.nav;
  return days >= 365 ? (Math.pow(ratio, 365 / days) - 1) * 100 : (ratio - 1) * 100;
}

export function sinceInception(s: NavPoint[]): number | null {
  if (s.length < 2) return null;
  const days = (t(s[s.length - 1]!.date) - t(s[0]!.date)) / DAY;
  if (days < 365) return null;
  return (Math.pow(s[s.length - 1]!.nav / s[0]!.nav, 365 / days) - 1) * 100;
}

/** Rolling CAGR over `years`, sampled at each NAV date. */
export function rollingReturns(s: NavPoint[], years: number) {
  const days = Math.round(years * 365); const out: number[] = [];
  for (const p of s) {
    const start = navOnOrBefore(s, t(p.date) - days * DAY);
    if (!start || t(p.date) - t(start.date) < (days - 7) * DAY) continue;
    out.push((Math.pow(p.nav / start.nav, 1 / years) - 1) * 100);
  }
  if (!out.length) return null;
  const avg = out.reduce((a, b) => a + b, 0) / out.length;
  return { avg, min: Math.min(...out), max: Math.max(...out), positivePct: (out.filter((x) => x > 0).length / out.length) * 100, count: out.length };
}

function dailyReturns(s: NavPoint[]) { const r: number[] = []; for (let i = 1; i < s.length; i++) r.push(s[i]!.nav / s[i - 1]!.nav - 1); return r; }
const sd = (x: number[]) => { const m = x.reduce((a, b) => a + b, 0) / x.length; return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1)); };

export function maxDrawdown(s: NavPoint[]): number | null {
  if (s.length < 2) return null; let peak = s[0]!.nav, mdd = 0;
  for (const p of s) { peak = Math.max(peak, p.nav); mdd = Math.min(mdd, p.nav / peak - 1); }
  return mdd * 100;
}

/** Annualised volatility, Sharpe, Sortino over the trailing window (rf in % p.a.). */
export function riskStats(s: NavPoint[], years: number, rf = 6.5) {
  const last = s[s.length - 1]; if (!last) return null;
  const from = t(last.date) - years * 365 * DAY;
  if (t(s[0]!.date) > from + 7 * DAY) return null;
  const w = s.filter((p) => t(p.date) >= from); const r = dailyReturns(w);
  if (r.length < 20) return null;
  const vol = sd(r) * Math.sqrt(252) * 100;
  const cagr = periodReturn(s, years * 365) ?? 0;
  const down = r.filter((x) => x < 0); const dd = down.length > 1 ? Math.sqrt(down.reduce((a, b) => a + b * b, 0) / r.length) * Math.sqrt(252) * 100 : null;
  return { vol, sharpe: vol ? (cagr - rf) / vol : null, sortino: dd ? (cagr - rf) / dd : null };
}

export function computeMetrics(s: NavPoint[]) {
  const r1 = rollingReturns(s, 1), r3 = rollingReturns(s, 3), risk1 = riskStats(s, 1), risk3 = riskStats(s, 3);
  return {
    as_of: s[s.length - 1]?.date ?? null,
    r_1m: periodReturn(s, 30), r_3m: periodReturn(s, 91), r_6m: periodReturn(s, 182), r_1y: periodReturn(s, 365),
    r_3y: periodReturn(s, 1095), r_5y: periodReturn(s, 1826), r_10y: periodReturn(s, 3652), r_since: sinceInception(s),
    rolling_1y_avg: r1?.avg ?? null, rolling_1y_min: r1?.min ?? null, rolling_1y_max: r1?.max ?? null, rolling_1y_pos_pct: r1?.positivePct ?? null,
    rolling_3y_avg: r3?.avg ?? null, rolling_3y_min: r3?.min ?? null, rolling_3y_max: r3?.max ?? null,
    volatility_1y: risk1?.vol ?? null, max_drawdown: maxDrawdown(s), sharpe_3y: risk3?.sharpe ?? null, sortino_3y: risk3?.sortino ?? null,
  };
}
