// Deterministic, transparent classification + relevance scoring.
// No LLM calls: cheap and predictable.

export type ScoredHeadline = {
  headline: string;
  source: string;
  source_url: string;
  canonical_key: string;
  published_at: string;
  category: string;
  relevance_tags: string[];
  market_relevance_score: number;
};

type Rule = { tag: string; category?: string; weight: number; words: string[] };

const RULES: Rule[] = [
  { tag: "RBI", category: "RBI / Central Banks", weight: 22, words: ["rbi", "reserve bank of india", "mpc", "monetary policy committee", "repo rate"] },
  { tag: "FED", category: "RBI / Central Banks", weight: 22, words: ["federal reserve", "fed chair", "fomc", "powell", "rate cut", "rate hike"] },
  { tag: "CENTRAL BANKS", category: "RBI / Central Banks", weight: 18, words: ["ecb", "bank of japan", "boj", "bank of england", "pboc", "central bank"] },
  { tag: "SEBI", category: "India", weight: 18, words: ["sebi", "market regulator"] },
  { tag: "INFLATION", category: "Macro", weight: 18, words: ["inflation", "cpi", "wpi", "consumer prices", "deflation"] },
  { tag: "RATES", category: "Macro", weight: 18, words: ["interest rate", "policy rate", "yields", "treasury yield", "rate decision"] },
  { tag: "GDP", category: "Macro", weight: 15, words: ["gdp", "growth forecast", "recession", "economic growth", "budget", "fiscal deficit"] },
  { tag: "BONDS", category: "Bonds", weight: 15, words: ["bond", "bonds", "debt issuance", "gilt", "sovereign debt", "credit market", "yield curve"] },
  { tag: "INR", category: "Currency", weight: 15, words: ["rupee", "inr", "dollar index", "forex", "currency", "exchange rate", "dollar deposits"] },
  { tag: "BANKING", category: "Banking", weight: 15, words: ["bank", "banks", "banking", "lender", "npa", "liquidity", "credit growth"] },
  { tag: "EQUITIES", category: "Markets", weight: 15, words: ["nifty", "sensex", "s&p 500", "nasdaq", "dow jones", "stocks", "equities", "shares", "index"] },
  { tag: "FLOWS", category: "Markets", weight: 13, words: ["fii", "dii", "foreign investors", "outflows", "inflows", "fund flows"] },
  { tag: "COMMODITIES", category: "Commodities", weight: 13, words: ["oil", "crude", "brent", "gold", "silver", "copper", "opec", "commodit"] },
  { tag: "TARIFFS", category: "Global", weight: 15, words: ["tariff", "trade war", "sanctions", "export curbs", "trade deal"] },
  { tag: "AI/TECH", category: "Technology / AI", weight: 12, words: ["artificial intelligence", " ai ", "nvidia", "openai", "semiconductor", "chipmaker", "microsoft", "apple", "alphabet", "google", "amazon", "meta"] },
  { tag: "EARNINGS", category: "Companies", weight: 12, words: ["earnings", "quarterly results", "profit rises", "profit falls", "guidance", "revenue"] },
  { tag: "DEALS", category: "Companies", weight: 12, words: ["merger", "acquisition", "acquires", "takeover", "stake sale", "ipo", "buyback"] },
  { tag: "CHINA", category: "Global", weight: 11, words: ["china", "beijing", "yuan", "hong kong"] },
  { tag: "GLOBAL", category: "Global", weight: 8, words: ["us markets", "wall street", "europe", "japan", "eurozone", "imf", "world bank"] },
  { tag: "INDIA", category: "India", weight: 10, words: ["india", "indian", "new delhi", "mumbai", "nse", "bse"] },
];

const REJECT = [
  "horoscope", "bollywood", "cricket", "recipe", "celebrity", "movie review", "box office",
  "fashion", "travel guide", "lifestyle", "gadget review", "football", "wedding", "web series",
];

const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "for", "to", "and", "with", "as", "at", "by", "from",
  "its", "it", "is", "are", "be", "after", "over", "amid", "says", "say", "will", "more",
  "new", "up", "down", "than", "that", "this", "into", "out",
]);

export function isRejected(headline: string): boolean {
  const h = headline.toLowerCase();
  return REJECT.some((w) => h.includes(w));
}

export function recencyScore(publishedAt: Date): number {
  const hours = (Date.now() - publishedAt.getTime()) / 3_600_000;
  if (hours < 0) return 40; // future timestamps: treat as fresh
  if (hours <= 1) return 40;
  if (hours <= 3) return 34;
  if (hours <= 6) return 28;
  if (hours <= 12) return 22;
  if (hours <= 24) return 16;
  if (hours <= 48) return 8;
  if (hours <= 96) return 3;
  return 0;
}

export function classify(headline: string, fallbackCategory?: string) {
  const h = ` ${headline.toLowerCase()} `;
  const tags: string[] = [];
  let impact = 0;
  let best: { category: string; weight: number } | null = null;

  for (const rule of RULES) {
    if (!rule.words.some((w) => h.includes(w))) continue;
    tags.push(rule.tag);
    impact += rule.weight;
    if (rule.category && (!best || rule.weight > best.weight)) {
      best = { category: rule.category, weight: rule.weight };
    }
  }

  return {
    tags: tags.slice(0, 5),
    impact: Math.min(impact, 45),
    category: best?.category ?? fallbackCategory ?? "Markets",
  };
}

/** Normalized signature used to spot the same story across sources. */
export function canonicalKey(headline: string): string {
  const words = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return Array.from(new Set(words)).sort().slice(0, 7).join("-");
}

export function scoreHeadline(input: {
  headline: string;
  source: string;
  source_url: string;
  published_at: Date;
  sourceQuality: number;
  fallbackCategory?: string;
}): ScoredHeadline | null {
  if (isRejected(input.headline)) return null;
  const { tags, impact, category } = classify(input.headline, input.fallbackCategory);
  if (impact === 0) return null; // nothing market-relevant in this headline

  const score = Math.min(100, recencyScore(input.published_at) + impact + input.sourceQuality);

  return {
    headline: input.headline.trim(),
    source: input.source,
    source_url: input.source_url,
    canonical_key: canonicalKey(input.headline),
    published_at: input.published_at.toISOString(),
    category,
    relevance_tags: tags,
    market_relevance_score: score,
  };
}

export const NEWS_CATEGORIES = [
  "All Categories",
  "India",
  "Global",
  "Markets",
  "RBI / Central Banks",
  "Bonds",
  "Currency",
  "Commodities",
  "Companies",
  "Technology / AI",
  "Macro",
  "Banking",
];
