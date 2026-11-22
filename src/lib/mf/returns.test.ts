import { describe, it, expect } from "vitest";
import { periodReturn, rollingReturns, maxDrawdown, sinceInception } from "./returns";

const series = (startNav: number, yearlyGrowth: number, years: number) => {
  const out = []; const start = Date.parse("2015-01-01T00:00:00Z");
  for (let d = 0; d <= years * 365; d++) out.push({ date: new Date(start + d * 864e5).toISOString().slice(0, 10), nav: startNav * Math.pow(1 + yearlyGrowth, d / 365) });
  return out;
};

describe("mf returns", () => {
  it("3Y CAGR of a steady 12% fund is 12%", () => { expect(periodReturn(series(10, 0.12, 5), 1095)).toBeCloseTo(12, 1); });
  it("returns null when history is shorter than the period", () => { expect(periodReturn(series(10, 0.12, 2), 1826)).toBeNull(); });
  it("1Y rolling returns of a steady fund are all ~10% and 100% positive", () => {
    const r = rollingReturns(series(10, 0.1, 4), 1)!; expect(r.min).toBeCloseTo(10, 0); expect(r.positivePct).toBe(100);
  });
  it("max drawdown of a 100→50→120 path is -50%", () => {
    expect(maxDrawdown([{ date: "2020-01-01", nav: 100 }, { date: "2020-02-01", nav: 50 }, { date: "2020-03-01", nav: 120 }])).toBeCloseTo(-50);
  });
  it("since inception needs a year of data", () => { expect(sinceInception(series(10, 0.1, 0.5))).toBeNull(); });
});
