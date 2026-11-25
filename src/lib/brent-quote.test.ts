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
import { parseTradingEconomicsBrent } from "./brent-quote";
test("parses Trading Economics Brent price and signed change", () => {
  const q = parseTradingEconomicsBrent("Brent rose to 115.95 USD/Bbl on October 28, 2026, up 1.82% from the previous day.");
  assert.equal(q?.price, 115.95);
  assert.equal(q?.changePercent, 1.82);
  assert.equal(parseTradingEconomicsBrent("Brent fell to 100 USD/Bbl on October 28, 2026, down 2% from the previous day.")?.changePercent, -2);
});
