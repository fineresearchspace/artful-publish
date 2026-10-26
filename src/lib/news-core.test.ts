import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { cleanText, summarizeArticle } from './news-core';

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
