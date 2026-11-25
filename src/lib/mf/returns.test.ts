import { test } from "node:test";
import assert from "node:assert/strict";
import { periodReturn, rollingReturns, maxDrawdown, sinceInception } from "./returns";

const series = (startNav: number, g: number, years: number) => {
  const out = []; const start = Date.parse("2015-01-01T00:00:00Z");
  for (let d = 0; d <= years * 365; d++) out.push({ date: new Date(start + d * 864e5).toISOString().slice(0, 10), nav: startNav * Math.pow(1 + g, d / 365) });
  return out;
};
const close = (a: number | null, b: number, tol = 0.1) => assert.ok(a != null && Math.abs(a - b) < tol, `${a} vs ${b}`);

test("3Y CAGR of a steady 12% fund is 12%", () => close(periodReturn(series(10, 0.12, 5), 1095), 12));
test("returns null when history is shorter than the period", () => assert.equal(periodReturn(series(10, 0.12, 2), 1826), null));
test("1Y rolling returns of a steady 10% fund are ~10% and 100% positive", () => {
  const r = rollingReturns(series(10, 0.1, 4), 1)!; close(r.min, 10, 0.5); assert.equal(r.positivePct, 100);
});
test("max drawdown of a 100→50→120 path is -50%", () =>
  close(maxDrawdown([{ date: "2020-01-01", nav: 100 }, { date: "2020-02-01", nav: 50 }, { date: "2020-03-01", nav: 120 }]), -50));
test("since inception needs a year of data", () => assert.equal(sinceInception(series(10, 0.1, 0.5)), null));
