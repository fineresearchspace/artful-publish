import { test } from "node:test";
import { strict as assert } from "node:assert";
import { recentHeadlines, relatedHeadlines, type NewsArticle } from "./headlines";

function story(id: number, title = "Nifty rises in India"): NewsArticle {
  return { id: String(id), title, summary: "", source: "Test", sourceUrl: "https://example.com", imageUrl: null, publishedAt: `2026-10-${String(id).padStart(2, "0")}T12:00:00Z`, category: "Markets" };
}

test("homepage shows only the six most recent headlines", () => {
  assert.deepEqual(recentHeadlines(Array.from({ length: 8 }, (_, i) => story(i + 1)), 6).map((a) => a.id), ["8", "7", "6", "5", "4", "3"]);
});

test("related articles shows three most recent matches, excluding unrelated articles", () => {
  const items = [story(1, "Gold rises"), story(2, "Oil falls"), story(3, "Silver gains"), story(4, "Copper rally"), story(5, "Nifty gains")];
  assert.deepEqual(relatedHeadlines(items, "commodities").map((a) => a.id), ["4", "3", "2"]);
});

test("each tab matches its own subject rather than falling back to unrelated stories", () => {
  const titles = { india: "Nifty gains", us: "Nasdaq rises", europe: "ECB weighs outlook", asia: "Nikkei climbs", bonds: "Sovereign yields rise", commodities: "Gold rises", currencies: "Forex markets fluctuate" } as const;
  const items = Object.values(titles).map((title, i) => story(i + 1, title));
  for (const [tab, title] of Object.entries(titles)) {
    assert.deepEqual(relatedHeadlines(items, tab as keyof typeof titles).map((a) => a.title), [title]);
  }
});