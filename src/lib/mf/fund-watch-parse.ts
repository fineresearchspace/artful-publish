/** Parses the multi-row headers used by AMC daily Fund Watch workbooks. */
export type FundWatchRow = {
  sheet_category: string;
  plan: string;
  scheme_name: string;
  launch_date: string | null;
  aum_cr: number | null;
  nav: number | null;
  avg_maturity_yrs: number | null;
  ytm: number | null;
  modified_duration: number | null;
  macaulay_duration: number | null;
  returns: Record<string, unknown>;
};

const str = (value: unknown) => (value == null ? "" : String(value).trim());

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/,/g, "");
  if (!cleaned || cleaned === "--" || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializableCell(value: unknown): string | number | boolean | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value).trim() || null;
}

function toDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 20000 && value < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + value * 864e5).toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return null;
}

/** Stable exact-match key for connecting AMC report names to AMFI growth schemes. */
export function fundWatchSchemeMatchKey(name: string, plan: string): string {
  const normalizedName = name.toLowerCase()
    .replace(/\b(multi)\s*cap\b/g, "multicap")
    .replace(/\b(mid)\s*cap\b/g, "midcap")
    .replace(/\b(small)\s*cap\b/g, "smallcap")
    .replace(/\b(large)\s*cap\b/g, "largecap")
    .replace(/\b(flexi)\s*cap\b/g, "flexicap")
    .replace(/\b(direct|regular|reg|growth|gr|idcw|dividend|option|plan|payout|reinvestment)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const planKey = /\bdirect\b/i.test(plan) ? "direct" : /\b(regular|reg)\b/i.test(plan) ? "regular" : "";
  return `${normalizedName}|${planKey}`;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** Converts a report caption such as "(As on October 15,2026)" to an ISO date. */
export function parseAsOf(text: string): string | null {
  const match = text.toLowerCase().match(/([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  const monthName = match?.[1];
  const day = match?.[2];
  const year = match?.[3];
  if (!monthName || !day || !year) return null;
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex < 0) return null;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function periodName(value: string): string | null {
  const label = value.replace(/\s+/g, " ").trim();
  if (/^\d+\s+(day|days|month|months|year|years)$/i.test(label) || /^since\s+/i.test(label) || /^mtd$/i.test(label)) {
    return label.toLowerCase();
  }
  return null;
}

function returnGroup(value: string): string | null {
  const label = value.toLowerCase();
  if (/^absolute return/.test(label)) return "absolute_returns";
  if (/^simple annualized return/.test(label)) return "simple_annualized_returns";
  if (/^annualized return/.test(label)) return "annualized_returns";
  if (/^return ranking/.test(label)) return "return_rankings";
  if (/^sip returns?/.test(label)) return "sip_returns";
  if (/^sip return ranking/.test(label)) return "sip_return_rankings";
  return null;
}

function fieldGroup(value: string): string | null {
  const label = value.toLowerCase();
  if (/^measures?$/.test(label)) return "Debt Measures";
  if (/^risk measures?$/.test(label)) return "Risk Measures";
  if (/^market capitalisation|^market capitalization/.test(label)) return "Market Capitalisation";
  if (/^amfi sectors?/.test(label)) return "AMFI Sectors";
  if (/^ratings?$/.test(label)) return "Ratings";
  if (/^instruments?$/.test(label)) return "Instruments";
  if (/^sector exposure/.test(label)) return "Sector Exposure";
  if (/^exit load/.test(label)) return "Exit Load";
  return null;
}

function isReturnGroup(value: string) {
  return returnGroup(value) != null;
}

function groupForPeriod(column: number, subHeaders: string[]): string {
  let group = "period_returns";
  for (let index = 0; index <= column; index += 1) {
    const next = returnGroup(subHeaders[index] ?? "");
    if (next) group = next;
  }
  return group;
}

function groupForField(column: number, headers: string[]): string {
  let group = "Other Fields";
  for (let index = 0; index <= column; index += 1) {
    const next = fieldGroup(headers[index] ?? "");
    if (next) group = next;
  }
  return group;
}

/** Parses all report fields, keeping return ranks and portfolio measures distinct from returns. */
export function parseFundWatchSheet(name: string, rows: unknown[][]): { asOf: string | null; rows: FundWatchRow[] } {
  let asOf: string | null = null;
  const output: FundWatchRow[] = [];
  const headerIndex = rows.findIndex((row) => row.some((cell) => str(cell).toLowerCase() === "launch date"));

  for (const row of rows.slice(0, headerIndex >= 0 ? headerIndex + 1 : rows.length)) {
    const text = row.map(str).join(" ");
    if (/as on/i.test(text)) asOf = parseAsOf(text) ?? asOf;
  }
  if (headerIndex < 0) return { asOf, rows: output };

  const headers = (rows[headerIndex] ?? []).map(str);
  const subHeaders = (rows[headerIndex + 1] ?? []).map(str);
  const launchColumn = headers.findIndex((label) => /^launch date$/i.test(label));
  const aumColumn = headers.findIndex((label) => /^aum\b/i.test(label));
  const navColumn = headers.findIndex((label) => /^nav$/i.test(label));
  const valueColumn = (pattern: RegExp) => subHeaders.findIndex((label) => pattern.test(label));
  const avgMaturityColumn = valueColumn(/avg\.?\s*maturity/i);
  const ytmColumn = valueColumn(/^ytm\b/i);
  const modifiedDurationColumn = valueColumn(/modified duration/i);
  const macaulayDurationColumn = valueColumn(/macaulay duration/i);

  const dateColumns = headers.map((label, index) => ({ index, name: periodName(label) })).filter((item) => item.name != null);
  let plan = "Direct";

  for (const row of rows.slice(headerIndex + 2)) {
    const first = str(row[0]);
    if (!first) continue;
    if (/regular plan/i.test(first)) {
      plan = "Regular";
      continue;
    }
    if (/direct plan/i.test(first)) {
      plan = "Direct";
      continue;
    }

    const launchDate = toDate(row[launchColumn]);
    const aum = aumColumn >= 0 ? numeric(row[aumColumn]) : null;
    const nav = navColumn >= 0 ? numeric(row[navColumn]) : null;
    if (!launchDate && aum == null && nav == null) continue;

    if (/\bregular\b/i.test(first)) plan = "Regular";
    else if (/\bdirect\b/i.test(first)) plan = "Direct";

    const reportFields: Record<string, Record<string, string | number | boolean | null>> = {};
    const periodGroups: Record<string, Record<string, number>> = {};
    const legacyReturns: Record<string, unknown> = {};

    for (const { index, name: period } of dateColumns) {
      if (!period) continue;
      const value = numeric(row[index]);
      if (value == null) continue;
      const group = groupForPeriod(index, subHeaders);
      const groupValues = periodGroups[group] ?? {};
      groupValues[period] = value;
      periodGroups[group] = groupValues;
      if (["absolute_returns", "simple_annualized_returns", "annualized_returns", "period_returns"].includes(group)) {
        legacyReturns[period] = value;
      }
    }

    const excluded = new Set([launchColumn, aumColumn, navColumn]);
    for (const index of [avgMaturityColumn, ytmColumn, modifiedDurationColumn, macaulayDurationColumn]) {
      if (index >= 0) excluded.add(index);
    }
    for (const { index } of dateColumns) excluded.add(index);

    for (let index = 0; index < row.length; index += 1) {
      if (excluded.has(index)) continue;
      const value = serializableCell(row[index]);
      if (value == null) continue;
      const header = headers[index] ?? "";
      const subHeader = subHeaders[index] ?? "";
      if (!header && !subHeader) continue;
      const group = groupForField(index, headers);
      const label = subHeader || header;
      const values = reportFields[group] ?? {};
      values[label] = value;
      reportFields[group] = values;
    }

    const returns: Record<string, unknown> = { ...legacyReturns };
    for (const [group, values] of Object.entries(periodGroups)) returns[group] = values;
    if (Object.keys(reportFields).length) returns["field_groups"] = reportFields;

    const fieldNumber = (index: number) => (index >= 0 ? numeric(row[index]) : null);
    output.push({
      sheet_category: name,
      plan,
      scheme_name: first,
      launch_date: launchDate,
      aum_cr: aum,
      nav,
      avg_maturity_yrs: fieldNumber(avgMaturityColumn),
      ytm: fieldNumber(ytmColumn),
      modified_duration: fieldNumber(modifiedDurationColumn),
      macaulay_duration: fieldNumber(macaulayDurationColumn),
      returns,
    });
  }

  return { asOf, rows: output };
}