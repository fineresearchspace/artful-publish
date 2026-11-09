import { test } from "node:test";
import assert from "node:assert/strict";
import { indexSessionQuote } from "./index-quote";

test("Smallcap quotes do not require two historical closes", () => {
  assert.deepEqual(indexSessionQuote({ regularMarketPrice: 19168.2, fulldayChange: 1.799, fulldayChangePercent: 0.009 }), {
    price: 19168.2, change: 1.799, changePercent: 0.009, asOf: null,
  });
});

test("Nifty session change uses the reported move, not the range's first close", () => {
  assert.equal(indexSessionQuote({ regularMarketPrice: 24991.45, fulldayChange: 5.049, fulldayChangePercent: 0.02 })?.change, 5.049);
});

test("Missing or invalid session figures remain unavailable", () => {
  assert.equal(indexSessionQuote({ regularMarketPrice: 19168.2 }), null);
  assert.equal(indexSessionQuote({ regularMarketPrice: NaN, fulldayChange: 1, fulldayChangePercent: 1 }), null);
});