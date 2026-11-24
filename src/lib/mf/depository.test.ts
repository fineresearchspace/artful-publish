import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFundWatchSheet, parseAsOf } from "./fund-watch-parse";
import { parseAmfiMonthly } from "./amfi-monthly-parse";
import { rollingVsBenchmark } from "./benchmark";

const sheet: unknown[][] = [
  ["Fund Watch - Liquid"], ["(As on October 15,2026)"],
  ["Liquid(Growth option)", null, "Launch Date", null, "AUM (in Crs) ", null, "NAV", null, "Measures", null, null, null, null, "1 Day", "1 Year"],
  [null, null, null, null, null, null, null, null, "Avg Maturity(in yrs)", "YTM", "Modified Duration", "Macaulay Duration"],
  ["Liquid - Direct Plan (Peer set)"],
  ["SBI Liquid Fund - Dir - Growth", null, new Date(Date.UTC(2013, 0, 1)), null, 77480.91, null, 4463.41, null, 0.1, 6.27, 0.09, 0.1, null, -2.35, 6.46],
  ["Liquid - Regular Plan"],
  ["SBI Liquid Fund - Growth", null, new Date(Date.UTC(2013, 0, 1)), null, 70000, null, 4400, null, 0.1, 6.27, 0.09, 0.1, null, -2.4, 6.3],
];
test("as-on date is read from the report header", () => assert.equal(parseAsOf("(As on October 15,2026)"), "2026-10-15"));
test("fund watch row captures AUM, YTM, durations and period returns", () => {
  const { asOf, rows } = parseFundWatchSheet("Liquid", sheet);
  assert.equal(asOf, "2026-10-15"); assert.equal(rows.length, 2);
  assert.deepEqual([rows[0]!.aum_cr, rows[0]!.ytm, rows[0]!.modified_duration, rows[0]!.macaulay_duration], [77480.91, 6.27, 0.09, 0.1]);
  assert.equal(rows[0]!.returns["1 year"], 6.46); assert.equal(rows[0]!.plan, "Direct"); assert.equal(rows[1]!.plan, "Regular");
});
test("AMFI monthly parser reads category flows and AUM", () => {
  const r = parseAmfiMonthly([["Sr", "Scheme Name", "No. of Schemes", "No. of Folios", "Funds Mobilized for the month (INR in crore)", "Repurchase/Redemption for the month (INR in crore)", "Net Inflow (+ve)/Outflow (-ve) for the month (INR in crore)", "Net Assets Under Management as on (INR in crore)", "Average Net Assets Under Management (INR in crore)"],
    ["1", "Flexi Cap Fund", 40, "1,20,000", 9000, 4000, 5000, 400000, 390000]]);
  assert.equal(r.length, 1); assert.equal(r[0]!.category, "Flexi Cap Fund"); assert.equal(r[0]!.net_inflow_cr, 5000); assert.equal(r[0]!.aum_cr, 400000); assert.equal(r[0]!.folios, 120000);
});
test("fund growing 15% vs benchmark 10% beats it in every 1Y window by ~5 points", () => {
  const mk = (g: number) => Array.from({ length: 3 * 365 }, (_, d) => ({ date: new Date(Date.UTC(2020, 0, 1) + d * 864e5).toISOString().slice(0, 10), nav: Math.pow(1 + g, d / 365) }));
  const r = rollingVsBenchmark(mk(0.15), mk(0.1), 1)!;
  assert.equal(r.beatPct, 100); assert.ok(Math.abs(r.excessAvg - 5) < 0.2);
});
