// Server-only ingestion pipeline:
// FETCH -> NORMALIZE -> DEDUPE -> CLASSIFY -> SCORE -> STORE
import { RSS_SOURCES, sourceQuality, type NewsSource } from "./sources";
import { scoreHeadline, type ScoredHeadline } from "./scoring";

type RawHeadline = {
  title: string;
  link: string;
  published: Date;
  source: string;
  fallbackCategory?: string;
};

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]!) : null;
}

function parseRss(xml: string, source: NewsSource): RawHeadline[] {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? [];
  const out: RawHeadline[] = [];

  for (const block of blocks) {
    const title = pick(block, "title");
    let link = pick(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1]! : null;
    }
    const dateRaw =
      pick(block, "pubDate") ?? pick(block, "published") ?? pick(block, "updated") ?? pick(block, "dc:date");
    if (!title || !link) continue;

    const published = dateRaw ? new Date(dateRaw) : new Date();
    if (Number.isNaN(published.getTime())) continue;

    // Google News aggregation appends " - Publisher" to the title.
    const cleanTitle = title.replace(/\s+-\s+[A-Za-z0-9.&' ]{3,30}$/, "").trim();

    out.push({
      title: cleanTitle,
      link: link.trim(),
      published,
      source: source.name,
      ...(source.defaultCategory ? { fallbackCategory: source.defaultCategory } : {}),
    });
  }
  return out;
}

async function fetchSource(source: NewsSource): Promise<RawHeadline[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { "user-agent": "WeeklyWondersNewsBot/1.0", accept: "application/rss+xml, application/xml, text/xml, */*" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!xml.includes("<")) throw new Error("Invalid feed payload");
    return parseRss(xml, source);
  } catch (error) {
    console.error(`[news] source failed: ${source.name} (${source.url})`, error);
    return [];
  }
}

function dedupe(items: ScoredHeadline[]): ScoredHeadline[] {
  const byKey = new Map<string, ScoredHeadline>();
  for (const item of items) {
    if (!item.canonical_key) continue;
    const existing = byKey.get(item.canonical_key);
    if (!existing) {
      byKey.set(item.canonical_key, item);
      continue;
    }
    const better =
      sourceQuality(item.source) > sourceQuality(existing.source) ||
      (sourceQuality(item.source) === sourceQuality(existing.source) &&
        item.market_relevance_score > existing.market_relevance_score);
    if (better) byKey.set(item.canonical_key, item);
  }
  return Array.from(byKey.values());
}

export async function refreshMarketNews(): Promise<{ fetched: number; stored: number; sources: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const results = await Promise.all(RSS_SOURCES.map(fetchSource));
  const raw = results.flat();
  const okSources = results.filter((r) => r.length > 0).length;

  const scored: ScoredHeadline[] = [];
  for (const item of raw) {
    const s = scoreHeadline({
      headline: item.title,
      source: item.source,
      source_url: item.link,
      published_at: item.published,
      sourceQuality: sourceQuality(item.source),
      ...(item.fallbackCategory ? { fallbackCategory: item.fallbackCategory } : {}),
    });
    if (s) scored.push(s);
  }

  const unique = dedupe(scored)
    .filter((s) => Date.now() - new Date(s.published_at).getTime() < 5 * 24 * 3600 * 1000)
    .sort((a, b) => b.market_relevance_score - a.market_relevance_score)
    .slice(0, 250);

  if (unique.length > 0) {
    const { error } = await supabaseAdmin
      .from("market_news")
      .upsert(unique as never, { onConflict: "canonical_key" });
    if (error) {
      console.error("[news] upsert failed", error);
      throw new Error(error.message);
    }
  }

  // Drop stale stories so the feed stays recent.
  const cutoff = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  await supabaseAdmin.from("market_news").delete().lt("published_at", cutoff);

  return { fetched: raw.length, stored: unique.length, sources: okSources };
}
