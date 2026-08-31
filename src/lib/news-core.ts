// Pure, stateless news-processing logic — safe for serverless (no shared
// mutable state between invocations). Each request fetches RSS fresh,
// classifies/dedupes/scores in-memory for that single request only.

export type ImpactLabel = "HIGH" | "MEDIUM" | "LOW";

export type Article = {
  id: string;
  title: string;
  description: string | null;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  category: string;
  subcategory: string;
  relevanceScore: number;
  importanceScore: number;
  marketImpactScore: number;
  tags: string[];
  impactLabel: ImpactLabel;
};

const financeKeywords = [
  "earnings", "revenue", "profit", "gdp", "inflation", "rbi", "fed",
  "interest rate", "stocks", "shares", "markets", "bonds", "yield", "ipo",
  "merger", "acquisition", "funding", "investment", "bank", "tariff",
  "trade", "oil", "gold", "currency", "forex", "central bank", "fiscal",
  "monetary", "sebi", "valuation",
];

const sourceScores: Record<string, number> = {
  RBI: 99, SEBI: 99, Reuters: 94, Bloomberg: 93, "Financial Times": 92,
  "The Economic Times": 88, "Business Standard": 87, Mint: 86, CNBC: 84,
  MarketWatch: 82, "Yahoo Finance": 78, Nasdaq: 80, "Investing.com": 74,
};


const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const normalizeTitle = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|as|to|of|and|in|on|for)\b/g, " ")
    .replace(/\s+/g, " ").trim();

const termSet = (value: string) => new Set(normalizeTitle(value).split(" ").filter(Boolean));

const similarity = (a: string, b: string) => {
  const left = termSet(a);
  const right = termSet(b);
  const intersection = [...left].filter((t) => right.has(t)).length;
  return intersection / Math.max(1, Math.min(left.size, right.size));
};

export const classifyRelevance = (title: string, description = "") => {
  const text = `${title} ${description}`.toLowerCase();
  const matches = financeKeywords.filter((k) => text.includes(k));
  return { isRelevant: matches.length > 0, score: Math.min(99, 45 + matches.length * 8), matches };
};

export const classifyCategory = (title: string, description = "") => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("rbi") || text.includes("central bank") || text.includes("rate")) return { category: "Economy & Policy", subcategory: "RBI / Monetary Policy" };
  if (text.includes("inflation") || text.includes("gdp")) return { category: "Economy & Policy", subcategory: "GDP / Economic Data" };
  if (text.includes("earnings") || text.includes("profit") || text.includes("revenue")) return { category: "Companies & Corporate", subcategory: "Earnings" };
  if (text.includes("oil") || text.includes("gold") || text.includes("commodity")) return { category: "Markets", subcategory: "Commodities" };
  if (text.includes("cloud") || text.includes("software") || text.includes("technology")) return { category: "Industries", subcategory: "Technology" };
  if (text.includes("bank") || text.includes("lender")) return { category: "Industries", subcategory: "Banking & Financial Services" };
  if (text.includes("asia") || text.includes(" us ") || text.includes("europe")) return { category: "Global Business", subcategory: "Emerging Markets" };
  return { category: "Markets", subcategory: "Market Movements" };
};

export const summarizeArticle = (title: string, description: string | null) => {
  const sourceText = stripHtml(description ?? "");
  if (sourceText.length >= 40) return sourceText.length > 300 ? `${sourceText.slice(0, 297)}...` : sourceText;
  return `${title}. Included because it contains a material finance, business, or markets signal.`;
};

const toImpactLabel = (value: number): ImpactLabel => (value >= 80 ? "HIGH" : value >= 60 ? "MEDIUM" : "LOW");

const scoreImportance = (publishedAt: string, source: string, relevanceScore: number, marketImpactScore: number) => {
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  const recency = Math.max(0, 100 - ageHours * 3);
  const credibility = sourceScores[source] ?? 65;
  return Math.round(0.3 * recency + 0.25 * marketImpactScore + 0.2 * credibility + 0.15 * relevanceScore + 0.1 * 72);
};

type RssItem = { title: string; link: string; description?: string; pubDate?: string; source: string };

const extractTag = (block: string, tag: string) => {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? stripHtml(match[1]).replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
};

const extractImage = (block: string) => {
  const media = block.match(/<media:content[^>]*url="([^"]+)"/i) || block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
  if (media?.[1]) return media[1];
  const imgTag = block.match(/<img[^>]*src="([^"]+)"/i);
  return imgTag?.[1] ?? null;
};

const parseRss = (xml: string, source: string): (RssItem & { imageUrl: string | null })[] =>
  [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => {
    const block = match[0];
    return {
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      description: extractTag(block, "description"),
      pubDate: extractTag(block, "pubDate"),
      source,
      imageUrl: extractImage(block),
    };
  }).filter((item) => item.title && /^https?:\/\//.test(item.link));

export type NewsFilters = {
  search?: string | undefined; category?: string | undefined;
  source?: string | undefined; minImpact?: number | undefined;
};

export const fetchAndProcessNews = async (rssConfig: string, filters: NewsFilters = {}) => {
  const feeds = rssConfig.split(",").map((entry) => entry.trim()).filter(Boolean);
  const results = await Promise.allSettled(
    feeds.map(async (config) => {
      const [source, url] = config.includes("|") ? config.split("|", 2) : ["Feed", config];
      if (!url) throw new Error(`${source}: missing feed URL`);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
      return parseRss(await response.text(), source ?? "Feed");
    })
  );

  const allItems = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const failedSources = results
    .map((r, i) => (r.status === "rejected" ? (feeds[i]?.split("|")[0] ?? null) : null))
    .filter((s): s is string => s !== null);

  let articles: Article[] = [];
  for (const item of allItems) {
    const relevance = classifyRelevance(item.title, item.description);
    if (!relevance.isRelevant) continue;

    const isDuplicate = articles.some((existing) => similarity(existing.title, item.title) >= 0.72);
    if (isDuplicate) continue;

    const publishedAt = item.pubDate && !Number.isNaN(new Date(item.pubDate).getTime())
      ? new Date(item.pubDate).toISOString()
      : new Date().toISOString();
    const category = classifyCategory(item.title, item.description);
    const marketImpactScore = Math.min(95, 48 + relevance.matches.length * 7);
    const importanceScore = scoreImportance(publishedAt, item.source, relevance.score, marketImpactScore);

    articles.push({
      id: `${item.source}-${normalizeTitle(item.title).slice(0, 40)}`,
      title: item.title,
      description: item.description || null,
      summary: summarizeArticle(item.title, item.description || null),
      source: item.source,
      sourceUrl: item.link,
      imageUrl: item.imageUrl,
      publishedAt,
      category: category.category,
      subcategory: category.subcategory,
      relevanceScore: relevance.score,
      importanceScore,
      marketImpactScore,
      tags: relevance.matches.slice(0, 5),
      impactLabel: toImpactLabel(marketImpactScore),
    });
  }

  const search = filters.search?.trim().toLowerCase();
  articles = articles.filter((a) => {
    const haystack = `${a.title} ${a.summary} ${a.source} ${a.category} ${a.subcategory}`.toLowerCase();
    return (
      (!search || haystack.includes(search)) &&
      (!filters.category || a.category.toLowerCase() === filters.category.toLowerCase()) &&
      (!filters.source || a.source.toLowerCase() === filters.source.toLowerCase()) &&
      (!filters.minImpact || a.marketImpactScore >= filters.minImpact)
    );
  });

  articles.sort((a, b) => b.importanceScore - a.importanceScore || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { articles, failedSources, sourcesTotal: feeds.length };
};

// Shared newsletter-draft builders (used by the same-origin API routes and the
// dev middleware shim for the Vercel-style root api/ functions).
type NewsletterArticle = Pick<Article, "category" | "title" | "summary" | "source" | "impactLabel" | "sourceUrl">;

export const buildMarkdown = (title: string, articles: NewsletterArticle[]) => {
  const grouped = new Map<string, NewsletterArticle[]>();
  articles.forEach((a) => grouped.set(a.category, [...(grouped.get(a.category) ?? []), a]));

  const lines = [`# ${title}`, "", "A focused briefing of today's most relevant finance stories.", ""];
  for (const [category, items] of grouped) {
    lines.push(`## ${category}`, "");
    items.forEach((a, i) => {
      lines.push(
        `### ${i + 1}. ${a.title}`,
        "",
        a.summary,
        "",
        `**Source:** ${a.source} · **Impact:** ${a.impactLabel}`,
        "",
        `[Read Original Article →](${a.sourceUrl})`,
        ""
      );
    });
  }
  return lines.join("\n");
};

export const buildHtml = (title: string, articles: NewsletterArticle[]) => {
  const grouped = new Map<string, NewsletterArticle[]>();
  articles.forEach((a) => grouped.set(a.category, [...(grouped.get(a.category) ?? []), a]));

  const sections = [...grouped.entries()].map(([category, items]) => `
    <section>
      <h2>${category}</h2>
      ${items.map((a) => `
        <article>
          <h3>${a.title}</h3>
          <p>${a.summary}</p>
          <p><strong>${a.source}</strong> · ${a.impactLabel}</p>
          <a href="${a.sourceUrl}" rel="noreferrer">Read Original Article →</a>
        </article>
      `).join("")}
    </section>
  `).join("");

  return `<article><h1>${title}</h1>${sections}</article>`;
};
