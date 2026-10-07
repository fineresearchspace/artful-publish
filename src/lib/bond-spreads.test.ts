import { describe, expect, test } from "bun:test";
import { tenYearSpreadBps } from "./bond-spreads";

describe("10Y spread vs US", () => {
  test("subtracts the US yield and converts percentage points to basis points", () => {
    expect(tenYearSpreadBps(7.24, 5.32)).toBe(192);
    expect(tenYearSpreadBps(3.50, 5.32)).toBe(-182);
    expect(tenYearSpreadBps(5.32, 5.32)).toBe(0);
  });
  test("does not substitute a zero yield for missing data", () => {
    expect(tenYearSpreadBps(undefined, 5.32)).toBeNull();
    expect(tenYearSpreadBps(7.24, undefined)).toBeNull();
  });
});