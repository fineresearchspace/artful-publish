export type MarketStory = { title: string; url: string; source: string; summary: string; publishedAt: string; imageUrl: string | null };

const TOPICS: Record<string, string[]> = {
  '^NSEI': ['nifty 50', 'nifty', 'sensex'], '^BSESN': ['sensex', 'nifty'],
  '^NSEBANK': ['bank nifty', 'nifty bank', 'banking stocks'], '^CNXIT': ['nifty it', 'it stocks', 'indian technology stocks'],
  '^CNXPHARMA': ['nifty pharma', 'pharma stocks', 'pharmaceutical stocks'],
  '^NSMIDCP': ['nifty next 50'], '^NSEMDCP50': ['nifty midcap', 'midcap stocks'], '^CRSLDX': ['nifty smallcap', 'smallcap stocks'],
  '^INDIAVIX': ['india vix'], '^GSPC': ['s&p 500', 's&p', 'wall street'], '^NDX': ['nasdaq'],
  '^DJI': ['dow jones', 'dow'], '^RUT': ['russell 2000', 'us small caps'], '^VIX': ['vix', 'fear gauge'],
  '^STOXX50E': ['euro stoxx', 'stoxx 50', 'european stocks'], '^FTSE': ['ftse'], '^GDAXI': ['dax', 'german stocks'],
  '^N225': ['nikkei', 'japanese stocks'], '^KS11': ['kospi', 'south korean stocks'], '^HSI': ['hang seng', 'hong kong stocks'],
  'GC=F': ['gold', 'bullion'], 'SI=F': ['silver'], 'BZ=F': ['brent', 'oil prices', 'crude'],
  'CL=F': ['wti', 'oil prices', 'crude'], 'NG=F': ['natural gas', 'lng'],
  'EURUSD=X': ['eur/usd', 'euro'], 'GBPUSD=X': ['gbp/usd', 'sterling', 'pound'],
  'USDJPY=X': ['usd/jpy', 'yen'], 'USDINR=X': ['usd/inr', 'rupee'], 'EURINR=X': ['eur/inr', 'euro rupee'],
};
const movement = /\b(ris(?:e|es|ing)|ros[e]|rall(?:y|ies|ied)|gain(?:s|ed)?|fall(?:s|ing)?|fell|drop(?:s|ped)?|slid(?:e|es)?|slump(?:s|ed)?|surge(?:s|d)?|climb(?:s|ed)?|declin(?:e|es|ed)|rebound(?:s|ed)?|steady|flat|higher|lower|up|down|strengthen(?:s|ed)?|weaken(?:s|ed)?|advance(?:s|d)?|retreat(?:s|ed)?|jump(?:s|ed)?|tumble(?:s|d)?)\b/i;

export function marketNewsTerms(symbol: string, name: string) {
  return TOPICS[symbol] ?? [name.toLowerCase().trim()];
}

function mentions(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(text);
}

export function selectMarketNews(items: MarketStory[], symbol: string, name: string, now = Date.now()) {
  const terms = marketNewsTerms(symbol, name);
  const related = items.filter((item) => {
    const age = now - Date.parse(item.publishedAt);
    return age >= 0 && age <= 48 * 60 * 60 * 1000 && /^https?:\/\//.test(item.url)
      && terms.some((term) => mentions(item.title, term));
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const unique = related.filter((item, i) => related.findIndex((other) => other.url === item.url || other.title === item.title) === i);
  return { related: unique.slice(0, 10), drivers: unique.filter((item) => movement.test(item.title)).slice(0, 4) };
}