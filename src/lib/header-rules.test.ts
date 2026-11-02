import { test } from "node:test";
import { strict as assert } from "node:assert";
import { shouldCollapseHeader, yieldChangePercent } from "./header-rules";
test("header collapses only after scrolling beyond 100px", () => {
  assert.equal(shouldCollapseHeader(100), false);
  assert.equal(shouldCollapseHeader(101), true);
});
test("bond ticker converts basis-point movement to percentage change, without inventing missing changes", () => {
  assert.ok(Math.abs((yieldChangePercent(7.05, 5) ?? 0) - 0.714285714) < 0.000001);
  assert.equal(yieldChangePercent(7.05, null), null);
});