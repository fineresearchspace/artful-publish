import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cleanText, parseRss, summarizeArticle } from './news-core';

test('escaped anchor markup never reaches a summary', () => {
  const description = '&lt;a href="https://news.google.com/rss/articles/CBMi1gJBVV95cUxP"&gt;Nifty support at 22,500: Angel One&lt;/a&gt; The benchmark index held above its support level.';
  const summary = summarizeArticle('Nifty support at 22,500: Angel One', description);
  assert.ok(!summary.includes('href'), summary);
  assert.ok(!summary.includes('http'), summary);
  assert.ok(!summary.includes('<'), summary);
  assert.ok(summary.includes('The benchmark index held above its support level.'), summary);
});

test('a truncated escaped anchor leaves no raw link text', () => {
  assert.equal(cleanText('&lt;a href="https://news.google.com/rss/articles/CBMiU0FVX3lxTFA1'), '');
});

test('ordinary entities still decode to readable copy', () => {
  assert.equal(cleanText('Rupee &amp; bond yields &#8211; steady'), 'Rupee & bond yields – steady');
});

test('CDATA-wrapped article links survive cleaning', () => {
  const items = parseRss('<rss><channel><item><title><![CDATA[Nifty rises on bank gains]]></title><link><![CDATA[https://www.livemint.com/markets/nifty-11792980669475.html]]></link><description><![CDATA[Banks lifted the benchmark.]]></description><pubDate><![CDATA[Mon, 26 Oct 2026 08:23:04 +0530]]></pubDate></item></channel></rss>', 'Mint');
  assert.equal(items[0]?.link, 'https://www.livemint.com/markets/nifty-11792980669475.html');
  assert.equal(items[0]?.title, 'Nifty rises on bank gains');
  assert.equal(items[0]?.description, 'Banks lifted the benchmark.');
});
