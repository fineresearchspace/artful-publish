import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchAndProcessNews } from "@/lib/news-core";

const RSS = [
  "Reuters|https://news.google.com/rss/search?q=when:2d+reuters.com+markets&hl=en-US&gl=US&ceid=US:en",
  "CNBC|https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258",
  "The Economic Times|https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "Mint|https://www.livemint.com/rss/markets",
  "Investing.com|https://www.investing.com/rss/news_25.rss",
].join(",");

const cache = new Map<string, { at: number; value: MarketReasons }>();

export type MarketReasons = {
  summary: string;
  reasons: string[];
  sources: Array<{ title: string; url: string; source: string }>;
};

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

    let headlines: Array<{ title: string; url: string; source: string; summary: string }> = [];
    try {
      const { articles } = await fetchAndProcessNews(process.env["NEWS_RSS_URLS"] || RSS);
      headlines = articles.slice(0, 40).map((a) => ({
        title: a.title,
        url: a.sourceUrl,
        source: a.source,
        summary: a.summary,
      }));
    } catch {
      // continue with no headlines
    }

    const direction =
      data.changePercent === null ? "flat" : data.changePercent >= 0 ? "up" : "down";
    const prompt = `Market: ${data.name} (${data.region}). Today's move: ${
      data.changePercent?.toFixed(2) ?? "n/a"
    }% (${direction}).

Recent headlines (numbered):
${headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title} — ${h.summary}`).join("\n")}

Explain the most likely reasons this market moved ${direction}. Use the headlines where relevant; if none apply, give general drivers and say they are likely factors. Be concise and factual, no hype.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a concise financial markets analyst." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "One sentence overview" },
                  reasons: { type: "array", items: { type: "string" }, description: "2-4 short reasons" },
                  headline_numbers: { type: "array", items: { type: "number" } },
                },
                required: ["summary", "reasons", "headline_numbers"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });
    if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are used up for now.");
    if (!res.ok) throw new Error("Explanation unavailable right now.");
    const json = await res.json();
    const args = JSON.parse(json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const value: MarketReasons = {
      summary: String(args.summary ?? ""),
      reasons: Array.isArray(args.reasons) ? args.reasons.map(String).slice(0, 4) : [],
      sources: (Array.isArray(args.headline_numbers) ? args.headline_numbers : [])
        .map((n: number) => headlines[n - 1])
        .filter(Boolean)
        .slice(0, 4)
        .map((h: (typeof headlines)[number]) => ({ title: h.title, url: h.url, source: h.source })),
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  });
