import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { brentSessionQuote } from "./brent-quote";

describe("Brent session quote", () => {
  test("uses the reported positive session move rather than the rolled historical close", () => {
    const quote = brentSessionQuote({ regularMarketPrice: 111.95, fulldayChange: 2.54, fulldayChangePercent: 2.322, regularMarketTime: 1793201776 });
    assert.equal(quote?.price, 111.95);
    assert.equal(quote?.change, 2.54);
    assert.equal(quote?.changePercent, 2.322);
    assert.notEqual(quote?.change, 111.95 - 113.88);
  });
  test("does not invent a session change when the provider omits it", () => {
    assert.equal(brentSessionQuote({ regularMarketPrice: 111.95, regularMarketTime: 1793201776 }), null);
  });
});