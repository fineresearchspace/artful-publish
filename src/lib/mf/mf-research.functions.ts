import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeMetrics, type NavPoint } from "./returns";

type Ctx = { supabase: any; userId: string };
async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
const r2 = (x: number | null) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);

async function loadNav(sb: any, code: number): Promise<NavPoint[]> {
  const out: NavPoint[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await sb.from("mf_nav_history").select("nav_date, nav").eq("scheme_code", code)
      .order("nav_date", { ascending: true }).range(from, from + 999);
    out.push(...(data ?? []).map((d: any) => ({ date: d.nav_date, nav: Number(d.nav) })));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Computes return analysis for funds that have NAV history. */
export const computeReturnMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ codes: z.array(z.number().int().positive()).max(50).optional(), category: z.string().max(200).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    let codes = data.codes ?? [];
    if (!codes.length) {
      let q = admin.from("mf_schemes").select("scheme_code").gt("history_points", 0).limit(50);
      if (data.category) q = q.eq("category", data.category);
      codes = ((await q).data ?? []).map((s: any) => s.scheme_code);
    }
    let done = 0;
    for (const code of codes) {
      const s = await loadNav(admin, code);
      if (s.length < 2) continue;
      const m = computeMetrics(s);
      const row: Record<string, unknown> = { scheme_code: code, as_of: m.as_of, computed_at: new Date().toISOString() };
      for (const [k, v] of Object.entries(m)) if (k !== "as_of") row[k] = r2(v as number | null);
      const { error } = await admin.from("mf_return_metrics").upsert(row, { onConflict: "scheme_code" });
      if (!error) done++;
    }
    await admin.from("mf_sync_runs").insert({ kind: "return_metrics", rows_written: done, detail: `${done}/${codes.length} funds` });
    return { computed: done, requested: codes.length };
  });

const num = z.number().nullable().optional();
const factsheetSchema = z.object({
  scheme_code: z.number().int().positive(),
  as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aum_cr: num, expense_ratio: num, exit_load: z.string().max(300).optional(), benchmark: z.string().max(200).optional(),
  inception_date: z.string().optional(), turnover_ratio: num, std_dev: num, beta: num, sharpe: num, pe: num, pb: num,
  ytm: num, modified_duration: num, macaulay_duration: num, avg_maturity_yrs: num,
  equity_pct: num, debt_pct: num, cash_pct: num, other_pct: num, large_cap_pct: num, mid_cap_pct: num, small_cap_pct: num,
  rating_mix: z.record(z.string(), z.number()).optional(),
  source: z.string().max(100).optional(), notes: z.string().max(5000).optional(),
  managers: z.array(z.object({ name: z.string().min(1).max(150), start_date: z.string().optional(), end_date: z.string().optional(),
    experience_years: num, qualifications: z.string().max(300).optional() })).max(10).optional(),
  holdings: z.array(z.object({ instrument: z.string().min(1).max(300), isin: z.string().max(20).optional(), sector: z.string().max(150).optional(),
    asset_type: z.string().max(80).optional(), rating: z.string().max(40).optional(), weight_pct: z.number(), market_value_cr: num })).max(500).optional(),
  sectors: z.array(z.object({ sector: z.string().min(1).max(150), weight_pct: z.number() })).max(100).optional(),
});

/** Saves a monthly factsheet snapshot with managers, holdings and sector mix. Sectors are derived from holdings if omitted. */
export const saveFactsheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => factsheetSchema.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const { managers = [], holdings = [], sectors, ...fs } = data;
    const { error } = await admin.from("mf_factsheets").upsert({ ...fs, rating_mix: fs.rating_mix ?? {} }, { onConflict: "scheme_code,as_of" });
    if (error) return { ok: false, error: error.message };
    for (const m of managers) {
      const { data: mg } = await admin.from("mf_managers").upsert({ name: m.name, experience_years: m.experience_years ?? null, qualifications: m.qualifications ?? "" }, { onConflict: "name" }).select("id").single();
      if (mg) await admin.from("mf_scheme_managers").upsert({ scheme_code: fs.scheme_code, manager_id: mg.id, start_date: m.start_date ?? null, end_date: m.end_date ?? null }, { onConflict: "scheme_code,manager_id,start_date" });
    }
    if (holdings.length) {
      await admin.from("mf_holdings").delete().eq("scheme_code", fs.scheme_code).eq("as_of", fs.as_of);
      await admin.from("mf_holdings").insert(holdings.map((h) => ({ ...h, scheme_code: fs.scheme_code, as_of: fs.as_of })));
    }
    let sec = sectors;
    if (!sec && holdings.length) {
      const m = new Map<string, number>();
      for (const h of holdings) if (h.sector) m.set(h.sector, (m.get(h.sector) ?? 0) + h.weight_pct);
      sec = [...m].map(([sector, weight_pct]) => ({ sector, weight_pct: Math.round(weight_pct * 100) / 100 }));
    }
    if (sec?.length) {
      await admin.from("mf_sector_allocation").delete().eq("scheme_code", fs.scheme_code).eq("as_of", fs.as_of);
      await admin.from("mf_sector_allocation").insert(sec.map((s) => ({ ...s, scheme_code: fs.scheme_code, as_of: fs.as_of })));
    }
    return { ok: true, error: null };
  });

/** Screener: funds with computed metrics joined to latest factsheet fields. */
export const getScreener = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ category: z.string().max(200).optional(), search: z.string().max(100).optional(),
    sort: z.enum(["r_1y", "r_3y", "r_5y", "rolling_3y_avg", "sharpe_3y", "max_drawdown", "volatility_1y"]).default("r_3y") }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = (context as Ctx).supabase;
    let q = sb.from("mf_return_metrics").select("*, mf_schemes!inner(scheme_name, fund_house, category, latest_nav, nav_date)")
      .order(data.sort, { ascending: data.sort === "volatility_1y", nullsFirst: false }).limit(200);
    if (data.category) q = q.eq("mf_schemes.category", data.category);
    if (data.search) q = q.ilike("mf_schemes.scheme_name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) return { rows: [], error: error.message };
    const codes = (rows ?? []).map((r: any) => r.scheme_code);
    const { data: fs } = codes.length ? await sb.from("mf_factsheets").select("scheme_code, as_of, aum_cr, expense_ratio, benchmark, ytm, modified_duration").in("scheme_code", codes).order("as_of", { ascending: false }) : { data: [] };
    const latest = new Map<number, any>(); for (const f of fs ?? []) if (!latest.has(f.scheme_code)) latest.set(f.scheme_code, f);
    return { rows: (rows ?? []).map((r: any) => ({ ...r, factsheet: latest.get(r.scheme_code) ?? null })), error: null };
  });

/** Everything for one fund: scheme, metrics, factsheets, managers, latest holdings/sectors, news, NAV series. */
export const getFundDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.number().int().positive() }).parse(d))
  .handler(async ({ context, data }) => {
    const sb = (context as Ctx).supabase; const code = data.code;
    const [scheme, metrics, factsheets, managers, news] = await Promise.all([
      sb.from("mf_schemes").select("*").eq("scheme_code", code).maybeSingle(),
      sb.from("mf_return_metrics").select("*").eq("scheme_code", code).maybeSingle(),
      sb.from("mf_factsheets").select("*").eq("scheme_code", code).order("as_of", { ascending: false }).limit(24),
      sb.from("mf_scheme_managers").select("start_date, end_date, role, mf_managers(name, experience_years, qualifications)").eq("scheme_code", code).order("start_date", { ascending: false }),
      sb.from("mf_news").select("*").eq("scheme_code", code).order("published_at", { ascending: false, nullsFirst: false }).limit(60),
    ]);
    const asOf = factsheets.data?.[0]?.as_of ?? null;
    const [holdings, sectors] = asOf ? await Promise.all([
      sb.from("mf_holdings").select("*").eq("scheme_code", code).eq("as_of", asOf).order("weight_pct", { ascending: false }),
      sb.from("mf_sector_allocation").select("*").eq("scheme_code", code).eq("as_of", asOf).order("weight_pct", { ascending: false }),
    ]) : [{ data: [] }, { data: [] }];
    const nav = await loadNav(sb, code);
    return { scheme: scheme.data, metrics: metrics.data, factsheets: factsheets.data ?? [], managers: managers.data ?? [],
      holdings: holdings.data ?? [], sectors: sectors.data ?? [], news: news.data ?? [], nav };
  });

// ---------- News feeder: news sites (Google News RSS), Reddit, Twitter/X ----------
const strip = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const tag = (x: string, n: string) => x.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`))?.[1] ?? "";
export function shortFundQuery(name: string) {
  return name.replace(/\s*-\s*(direct|regular).*$/i, "").replace(/\b(direct|regular|plan|growth|option|idcw)\b/gi, "").replace(/\s+/g, " ").trim();
}

type NewsRow = { source_type: "news" | "reddit" | "twitter"; source_name: string; title: string; summary: string; url: string; author: string | null; published_at: string | null };

async function fetchGoogleNews(q: string): Promise<NewsRow[]> {
  const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(`"${q}"`)}&hl=en-IN&gl=IN&ceid=IN:en`, { headers: { "User-Agent": "Mozilla/5.0 TheContext/1.0" } });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 25).map(([, it]) => {
    const pub = tag(it!, "pubDate");
    return { source_type: "news" as const, source_name: strip(tag(it!, "source")) || "News", title: strip(tag(it!, "title")), summary: "",
      url: strip(tag(it!, "link")), author: null, published_at: pub ? new Date(pub).toISOString() : null };
  }).filter((n) => n.url && n.title);
}
async function fetchReddit(q: string): Promise<NewsRow[]> {
  const r = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(`"${q}"`)}&sort=new&limit=25`, { headers: { "User-Agent": "TheContext/1.0 (research)" } });
  if (!r.ok) return [];
  const j = (await r.json()) as any;
  return (j?.data?.children ?? []).map((c: any) => c.data).map((d: any) => ({
    source_type: "reddit" as const, source_name: `r/${d.subreddit}`, title: String(d.title ?? "").slice(0, 400), summary: String(d.selftext ?? "").slice(0, 600),
    url: `https://www.reddit.com${d.permalink}`, author: d.author ?? null, published_at: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
  }));
}
async function fetchX(q: string): Promise<{ rows: NewsRow[]; status: string }> {
  const lk = process.env["LOVABLE_API_KEY"], xk = process.env["X_API_KEY"];
  if (!lk || !xk) return { rows: [], status: "Twitter/X not connected" };
  const r = await fetch(`https://connector-gateway.lovable.dev/x/tweets/search/recent?query=${encodeURIComponent(`"${q}" -is:retweet lang:en`)}&max_results=25&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username`,
    { headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": xk } });
  if (!r.ok) { console.error("X search failed", r.status, await r.text()); return { rows: [], status: `Twitter/X error ${r.status}` }; }
  const j = (await r.json()) as any;
  const users = new Map<string, string>((j.includes?.users ?? []).map((u: any) => [u.id, u.username]));
  return { status: "ok", rows: (j.data ?? []).map((tw: any) => {
    const u = users.get(tw.author_id) ?? "i";
    return { source_type: "twitter" as const, source_name: `@${u}`, title: String(tw.text).slice(0, 400), summary: "", url: `https://x.com/${u}/status/${tw.id}`, author: u, published_at: tw.created_at ?? null };
  }) };
}

/** Pulls latest mentions of a fund from news sites, Reddit and Twitter/X. */
export const syncFundNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.number().int().positive() }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const { data: s } = await admin.from("mf_schemes").select("scheme_name, fund_house").eq("scheme_code", data.code).maybeSingle();
    if (!s) return { ok: false, counts: {}, status: {} };
    const q = shortFundQuery(s.scheme_name);
    const settle = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch (e) { console.error(e); return fb; } };
    const [news, reddit, x] = await Promise.all([settle(fetchGoogleNews(q), []), settle(fetchReddit(q), []), settle(fetchX(q), { rows: [], status: "Twitter/X failed" })]);
    const all = [...news, ...reddit, ...x.rows].map((n) => ({ ...n, scheme_code: data.code, fund_house: s.fund_house }));
    if (all.length) await admin.from("mf_news").upsert(all, { onConflict: "url", ignoreDuplicates: true });
    await admin.from("mf_sync_runs").insert({ kind: "fund_news", rows_written: all.length, detail: `${q}: news ${news.length}, reddit ${reddit.length}, x ${x.rows.length}` });
    return { ok: true, counts: { news: news.length, reddit: reddit.length, twitter: x.rows.length }, status: { twitter: x.status } };
  });
