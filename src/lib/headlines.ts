export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  category: string;
  impactLabel?: "HIGH" | "MEDIUM" | "LOW";
};

export type MarketNewsTab = "india" | "us" | "europe" | "asia" | "bonds" | "commodities" | "currencies";

const TAB_TERMS: Record<MarketNewsTab, RegExp> = {
  india: /\b(india|indian|nifty|sensex|rbi|rupee|dalal|mumbai|sebi)\b/i,
  us: /\b(us|usa|u\.s\.|united states|wall street|nasdaq|s&p|dow|federal reserve|fed|treasury|american)\b/i,
  europe: /\b(europe|european|ecb|eurozone|germany|german|dax|ftse|britain|british|uk|u\.k\.|france|french|stoxx)\b/i,
  asia: /\b(asia|asian|japan|japanese|nikkei|topix|china|chinese|hong kong|hang seng|korea|korean|taiwan|singapore|boj)\b/i,
  bonds: /\b(bond|bonds|yield|yields|treasury|treasuries|sovereign|gilts|fixed income|debt market)\b/i,
  commodities: /\b(gold|silver|bullion|oil|crude|brent|wti|opec|natural gas|copper|commodity|commodities|metals)\b/i,
  currencies: /\b(currency|currencies|forex|fx|dollar|euro|yen|rupee|sterling|pound|exchange rate)\b/i,
};

export function recentHeadlines(items: NewsArticle[], limit?: number) {
  const sorted = [...items].sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

export function relatedHeadlines(items: NewsArticle[], tab: MarketNewsTab) {
  return recentHeadlines(items.filter((article) => TAB_TERMS[tab].test(`${article.title} ${article.summary}`)), 3);
}