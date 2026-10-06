import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchAndProcessNews } from "@/lib/news-core";

const RSS = [
  "Reuters|https://news.google.com/rss/search?q=when:2d+reuters.com+markets&hl=en-US&gl=US&ceid=US:en",
  "CNBC|https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
  "The Economic Times|https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "Mint|https://www.livemint.com/rss/markets",
  "Investing.com|https://www.investing.com/rss/news_25.rss",
  "Investing.com|https://www.investing.com/rss/news.rss",
].join(",");

type Headline = { title: string; url: string; source: string; summary: string; publishedAt: string; imageUrl: string | null };

export type MarketReasons = {
  summary: string;
  reasons: string[];
  background: string;
  sources: Array<{ title: string; url: string; source: string }>;
  related: Array<{ title: string; url: string; source: string; summary: string; publishedAt: string; imageUrl: string | null }>;
};

const cache = new Map<string, { at: number; value: MarketReasons }>();

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
    background: { type: "string" },
    headline_numbers: { type: "array", items: { type: "number" } },
  },
  required: ["summary", "reasons", "background", "headline_numbers"],
};

function keywords(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9/& ]/g, " ");
  const words = base.split(/[\s/]+/).filter((w) => w.length > 2 && !["nifty", "index", "the"].includes(w));
  const extra: Record<string, string[]> = {
    gold: ["gold", "bullion"],
    silver: ["silver"],
    crude: ["oil", "crude", "brent", "opec"],
    brent: ["oil", "brent", "opec"],
    natural: ["natural gas", "lng"],
    sensex: ["sensex", "nifty", "dalal"],
    "50": ["nifty", "sensex"],
    bank: ["bank"],
    pharma: ["pharma", "drug"],
    usd: ["dollar", "rupee", "fed"],
    inr: ["rupee"],
    eur: ["euro", "ecb"],
    gbp: ["pound", "sterling"],
    jpy: ["yen", "boj"],
  };
  const out = new Set<string>(words);
  for (const w of words) extra[w]?.forEach((x) => out.add(x));
  if (name.toLowerCase().includes("nifty")) out.add("nifty");
  return [...out];
}

async function streamResponse(prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Lovable-API-Key": process.env["LOVABLE_API_KEY"] ?? "",
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "X-Lovable-AIG-SDK": "fetch",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: "You are a concise, factual financial markets analyst writing for an editorial finance publication.",
      input: prompt,
      text: { format: { type: "json_schema", name: "market_reasons", strict: true, schema: SCHEMA } },
    }),
  });
  if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits are used up for now.");
  if (res.status === 403) throw new Error("AI access is currently blocked for this workspace.");
  if (!res.ok || !res.body) {
    console.error("AI gateway", res.status, await res.text().catch(() => ""));
    throw new Error("Explanation unavailable right now.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "error" || ev.type === "response.failed") throw new Error("Explanation unavailable right now.");
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("Explanation")) throw e;
      }
    }
  }
  return text;
}

export const explainMarketMove = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(80),
        region: z.string().max(40),
        changePercent: z.number().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<MarketReasons> => {
    const key = `${data.name}|${data.changePercent?.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 20 * 60 * 1000) return hit.value;

    let headlines: Headline[] = [];
    try {
      const { articles } = await fetchAndProcessNews(process.env["NEWS_RSS_URLS"] || RSS);
      headlines = articles.map((a) => ({
        title: a.title,
        url: a.sourceUrl,
        source: a.source,
        summary: a.summary,
        publishedAt: a.publishedAt,
        imageUrl: a.imageUrl,
      }));
    } catch {
      // continue without headlines
    }

    const kws = keywords(data.name);
    const related = headlines
      .filter((h) => {
        const t = `${h.title} ${h.summary}`.toLowerCase();
        return kws.some((k) => t.includes(k));
      })
      .slice(0, 10);
    const context = [...related, ...headlines.filter((h) => !related.includes(h))].slice(0, 35);

    const direction = data.changePercent === null ? "flat" : data.changePercent >= 0 ? "up" : "down";
    const prompt = `Market: ${data.name} (${data.region}). Today's move: ${
      data.changePercent?.toFixed(2) ?? "n/a"
    }% (${direction}).

Recent headlines (numbered):
${context.map((h, i) => `${i + 1}. [${h.source}] ${h.title} — ${h.summary}`).join("\n")}

Return:
- summary: one sentence on why it moved ${direction} today.
- reasons: 2-4 short reasons, grounded in the headlines where relevant; if none apply, give likely general drivers and say so.
- background: a 2-3 sentence plain-language primer on what ${data.name} is and its long-term history.
- headline_numbers: numbers of the headlines you relied on (may be empty).`;

    const raw = await streamResponse(prompt);
    let args: { summary?: string; reasons?: string[]; background?: string; headline_numbers?: number[] } = {};
    try {
      args = JSON.parse(raw);
    } catch {
      throw new Error("Explanation unavailable right now.");
    }
    const value: MarketReasons = {
      summary: String(args.summary ?? ""),
      reasons: (args.reasons ?? []).map(String).slice(0, 4),
      background: String(args.background ?? ""),
      sources: (args.headline_numbers ?? [])
        .map((n) => context[n - 1])
        .filter((h): h is Headline => Boolean(h))
        .slice(0, 4)
        .map((h) => ({ title: h.title, url: h.url, source: h.source })),
      related,
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  });
