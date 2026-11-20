export type AmfiScheme = {
  scheme_code: number;
  isin_growth: string | null;
  isin_reinvest: string | null;
  scheme_name: string;
  fund_house: string | null;
  scheme_type: string | null;
  category: string | null;
  plan: string | null;
  option_type: string | null;
  latest_nav: number | null;
  nav_date: string | null;
};

const MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };

/** "19-Nov-2026" -> "2026-11-19" */
export function amfiDate(s: string): string | null {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const mon = MONTHS[(m[2] ?? "").toLowerCase()];
  return mon ? `${m[3]}-${mon}-${(m[1] ?? "").padStart(2, "0")}` : null;
}

/** "19-11-2026" -> "2026-11-19" (mfapi.in format) */
export function dmyDate(s: string): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

const clean = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return t && t !== "-" ? t : null;
};

/** Parses AMFI NAVAll.txt into scheme rows, tracking section (type/category) and fund-house headers. */
export function parseAmfiNavAll(text: string): AmfiScheme[] {
  const out: AmfiScheme[] = [];
  let schemeType: string | null = null;
  let category: string | null = null;
  let house: string | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("Scheme Code")) continue;
    if (!line.includes(";")) {
      const sec = /^(.*?Schemes?)\s*\((.*)\)$/.exec(line);
      if (sec) { schemeType = sec[1]?.trim() ?? null; category = sec[2]?.trim() ?? null; house = null; }
      else house = line;
      continue;
    }
    const c = line.split(";");
    const code = Number(c[0]);
    if (!Number.isInteger(code) || code <= 0) continue;
    const nav = Number(c[6]);
    out.push({
      scheme_code: code,
      isin_growth: clean(c[1]),
      isin_reinvest: clean(c[2]),
      scheme_name: clean(c[3]) ?? `Scheme ${code}`,
      fund_house: house,
      scheme_type: schemeType,
      category,
      plan: clean(c[4]),
      option_type: clean(c[5]),
      latest_nav: Number.isFinite(nav) && nav > 0 ? nav : null,
      nav_date: amfiDate(c[7] ?? ""),
    });
  }
  // de-dupe by code (keep last)
  return [...new Map(out.map((s) => [s.scheme_code, s])).values()];
}
