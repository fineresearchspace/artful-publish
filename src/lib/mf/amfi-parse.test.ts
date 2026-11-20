import { test } from "node:test";
import assert from "node:assert/strict";
const expect = (v: unknown) => ({ toBe: (e: unknown) => assert.equal(v, e), toBeNull: () => assert.equal(v, null) });
import { parseAmfiNavAll, amfiDate, dmyDate } from "./amfi-parse";

const sample = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date

Open Ended Schemes(Equity Scheme - Flexi Cap Fund)

PPFAS Mutual Fund

122639;INF879O01027;-;Parag Parikh Flexi Cap Fund;Direct Plan;Growth Option;95.1234;19-Nov-2026
122640;-;-;Bad Fund;Direct Plan;Growth;N.A.;19-Nov-2026
`;

test("parses section category and fund house", () => {
  const rows = parseAmfiNavAll(sample);
  expect(rows.length).toBe(2);
  expect(rows[0]?.category).toBe("Equity Scheme - Flexi Cap Fund");
  expect(rows[0]?.fund_house).toBe("PPFAS Mutual Fund");
  expect(rows[0]?.latest_nav).toBe(95.1234);
  expect(rows[0]?.nav_date).toBe("2026-11-19");
});
test("missing NAV stays null, not invented", () => {
  expect(parseAmfiNavAll(sample)[1]?.latest_nav).toBeNull();
});
test("dates", () => {
  expect(amfiDate("01-Jan-2020")).toBe("2020-01-01");
  expect(dmyDate("19-11-2026")).toBe("2026-11-19");
});
