import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { tenYearSpreadBps } from "./bond-spreads";

describe("10Y spread vs US", () => {
  test("subtracts the US yield and converts percentage points to basis points", () => {
    assert.equal(tenYearSpreadBps(7.24, 5.32), 192);
    assert.equal(tenYearSpreadBps(3.50, 5.32), -182);
    assert.equal(tenYearSpreadBps(5.32, 5.32), 0);
  });
  test("does not substitute a zero yield for missing data", () => {
    assert.equal(tenYearSpreadBps(undefined, 5.32), null);
    assert.equal(tenYearSpreadBps(7.24, undefined), null);
  });
});