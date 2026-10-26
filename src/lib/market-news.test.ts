import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isSameDay, selectMarketNews } from './market-news';
const now = Date.parse('2026-10-09T06:00:00Z');
function story(title: string, date = '2026-10-09T05:00:00Z') {
  return { title, url: `https://example.com/${encodeURIComponent(title)}`, source: 'Reuters', summary: 'Reported text', publishedAt: date, imageUrl: null };
}
test('drivers use reported indicator-specific market moves, not unrelated headlines', () => {
  const result = selectMarketNews([story('Gold rises as dollar weakens'), story('Oil rises on supply concerns'), story('Gold jewellery exhibition opens')], 'GC=F', 'Gold', now);
  assert.deepEqual(result.drivers.map((s) => s.title), ['Gold rises as dollar weakens']);
  assert.equal(result.drivers[0]?.summary, 'Reported text');
});
test('no recent matching reporting means no invented driver or unrelated fallback', () => {
  assert.deepEqual(selectMarketNews([story('Gold rises', '2026-10-05T05:00:00Z'), story('Oil rises')], 'GC=F', 'Gold', now).drivers, []);
});
test('every market group matches its own indicator', () => {
  const cases: Array<[string, string, string]> = [['^NSEI','NIFTY 50','Nifty rises on bank gains'],['^GSPC','S&P 500','S&P 500 falls after inflation report'],['^GDAXI','DAX','DAX rises on earnings'],['^N225','Nikkei 225','Nikkei falls as yen strengthens'],['NG=F','Natural Gas','Natural gas rises on colder weather'],['USDJPY=X','USD/JPY','Yen strengthens after policy decision'],['^CNXPHARMA','NIFTY Pharma','Pharma stocks rise on earnings']];
  for (const [symbol, name, title] of cases) {
    assert.equal(selectMarketNews([story(title),story('Gold rises')],symbol,name,now).drivers[0]?.title,title);
  }
});
test('short names do not match substrings or future stories', () => {
  assert.equal(selectMarketNews([story('Shadow rises'),story('Dow rises','2026-10-10T05:00:00Z')],'^DJI','Dow',now).drivers.length,0);
});
test('articles below an indicator stay within the same day', () => {
  const result = selectMarketNews(
    [story('Gold rises on dollar weakness'), story('Gold gains on safe-haven demand', '2026-10-08T05:00:00Z')],
    'GC=F', 'Gold', now,
  );
  assert.deepEqual(result.related.map((s) => s.title), ['Gold rises on dollar weakness']);
});
test('a market with no same-day coverage keeps its most recent items', () => {
  const result = selectMarketNews(
    [story('Gold rises on dollar weakness', '2026-10-08T05:00:00Z'), story('Gold slips on profit booking', '2026-10-08T01:00:00Z')],
    'GC=F', 'Gold', now,
  );
  assert.deepEqual(result.related.map((s) => s.title), ['Gold rises on dollar weakness', 'Gold slips on profit booking']);
});
test('same day follows the India calendar day, not UTC midnight', () => {
  assert.equal(isSameDay('2026-10-08T19:00:00Z', now), true);
  assert.equal(isSameDay('2026-10-08T18:00:00Z', now), false);
});