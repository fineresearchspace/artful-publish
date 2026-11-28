import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseFundWatchSheet } from "./fund-watch-parse";
import { parseAmfiMonthly } from "./amfi-monthly-parse";
import { rollingVsBenchmark } from "./benchmark";
import type { NavPoint } from "./returns";

type Ctx = { supabase: any; userId: string };
async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
async function readWorkbook(b64: string) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), { type: "array", cellDates: true });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    return { name, rows: sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null }) : [] };
  });
}
const fileInput = z.object({ fileBase64: z.string().min(10).max(15_000_000), fileName: z.string().max(200).default("upload.xlsx") });

/** Validates a Fund Watch workbook and returns a small review sample without writing it. */
export const previewFundWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fileInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const sheets = await readWorkbook(data.fileBase64);
    const parsed: { sheet: string; asOf: string | null; rows: any[] }[] = [];
    for (const sheet of sheets) {
      const result = parseFundWatchSheet(sheet.name, sheet.rows);
      if (result.rows.length) parsed.push({ sheet: sheet.name, asOf: result.asOf, rows: result.rows });
    }
    const asOf = parsed.find((sheet) => sheet.asOf)?.asOf ?? null;
    const rows = parsed.flatMap((sheet) => sheet.rows.map((row) => ({ ...row, as_of: sheet.asOf ?? asOf })));
    const categories = [...new Set(parsed.map((sheet) => sheet.sheet))].sort((a, b) => a.localeCompare(b));
    return {
      ok: Boolean(asOf && rows.length),
      asOf,
      sheetCount: parsed.length,
      rowCount: rows.length,
      categories,
      sample: rows.slice(0, 5),
      error: rows.length ? (asOf ? null : "The report date could not be found in its headers") : "No fund rows were found in this workbook",
    };
  });

/** Imports an AMC daily Fund Watch workbook (Kotak format): every category sheet → mf_daily_fund_watch. */
export const importFundWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fileInput.parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const sheets = await readWorkbook(data.fileBase64);
    const all: any[] = [];
    let asOf: string | null = null;
    for (const s of sheets) {
      const p = parseFundWatchSheet(s.name, s.rows);
      asOf = asOf ?? p.asOf;
      all.push(...p.rows.map((r) => ({ ...r, as_of: p.asOf })));
    }
    if (!asOf) return { ok: false, written: 0, asOf: null, error: "The report date could not be found in its headers" };
    const rows = all.filter((r) => r.as_of ?? asOf).map((r) => ({ ...r, as_of: r.as_of ?? asOf, source: data.fileName }));
    if (!rows.length) return { ok: false, written: 0, asOf, error: "No fund rows were found in this workbook" };
    const seen = new Set<string>(); const uniq = rows.filter((r) => { const k = `${r.sheet_category}|${r.plan}|${r.scheme_name}`; if (seen.has(k)) return false; seen.add(k); return true; });
    for (let i = 0; i < uniq.length; i += 500) {
      const { error } = await admin.from("mf_daily_fund_watch").upsert(uniq.slice(i, i + 500), { onConflict: "as_of,sheet_category,plan,scheme_name" });
      if (error) return { ok: false, written: i, asOf, error: error.message };
    }
    await admin.from("mf_sync_runs").insert({ kind: "fund_watch", rows_written: uniq.length, detail: `${data.fileName} as of ${asOf}` });
    return { ok: true, written: uniq.length, asOf, error: null };
  });

/** Reviews category rows in an AMFI monthly workbook before import. */
export const previewAmfiMonthly = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fileInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as Ctx);
    const sheets = await readWorkbook(data.fileBase64);
    const rows = sheets.flatMap((sheet) => parseAmfiMonthly(sheet.rows));
    const unique = [...new Map(rows.map((row) => [row.category, row])).values()];
    return {
      ok: unique.length > 0,
      rowCount: unique.length,
      sample: unique.slice(0, 8),
      error: unique.length ? null : "No category flow rows were found in this workbook",
    };
  });

/** Imports an AMFI monthly report workbook for a month → category flows/AUM. */
export const importAmfiMonthly = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fileInput.extend({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const month = `${data.month}-01`;
    const rows = (await readWorkbook(data.fileBase64)).flatMap((s) => parseAmfiMonthly(s.rows));
    const m = new Map(rows.map((r) => [r.category, { ...r, month }]));
    if (!m.size) return { ok: false, written: 0, error: "No AMFI category rows found in this file" };
    const { error } = await admin.from("mf_amfi_monthly").upsert([...m.values()], { onConflict: "month,category" });
    if (error) return { ok: false, written: 0, error: error.message };
    await admin.from("mf_sync_runs").insert({ kind: "amfi_monthly", rows_written: m.size, detail: `${data.month}: ${data.fileName}` });
    return { ok: true, written: m.size, error: null };
  });

/** Saves industry-level monthly figures (SIP flows, total AUM, folios). */
export const saveAmfiIndustryMonth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), sip_contribution_cr: z.number().nullable(), sip_accounts: z.number().nullable(),
    sip_aum_cr: z.number().nullable(), total_aum_cr: z.number().nullable(), total_folios: z.number().nullable(), net_inflow_cr: z.number().nullable(),
    notes: z.string().max(2000).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const { error } = await admin.from("mf_amfi_industry_monthly").upsert({ ...data, month: `${data.month}-01` }, { onConflict: "month" });
    return { ok: !error, error: error?.message ?? null };
  });

async function loadNav(sb: any, code: number): Promise<NavPoint[]> {
  const out: NavPoint[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await sb.from("mf_nav_history").select("nav_date, nav").eq("scheme_code", code).order("nav_date").range(from, from + 999);
    out.push(...(data ?? []).map((d: any) => ({ date: d.nav_date, nav: Number(d.nav) }))); if (!data || data.length < 1000) break;
  }
  return out;
}
/** Finds the benchmark proxy (Direct Growth index fund) for a fund's category. */
async function benchmarkFor(sb: any, category: string) {
  const { data: guide } = await sb.from("mf_category_guide").select("*");
  const g = (guide ?? []).find((x: any) => x.match_terms.some((t: string) => category.toLowerCase().includes(t.toLowerCase())));
  if (!g?.benchmark_proxy_query) return { guide: g ?? null, proxy: null };
  const words = g.benchmark_proxy_query.split(/\s+/).filter((w: string) => !/^(fund|direct)$/i.test(w));
  let q = sb.from("mf_schemes").select("scheme_code, scheme_name, history_points").ilike("scheme_name", "%direct%").ilike("scheme_name", "%growth%");
  for (const w of words) q = q.ilike("scheme_name", `%${w}%`);
  const { data } = await q.order("history_points", { ascending: false }).limit(1);
  return { guide: g, proxy: data?.[0] ?? null };
}

/** Rolling 1Y/3Y/5Y returns of a fund against its category benchmark proxy (syncs proxy history if missing). */
export const compareWithBenchmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.number().int().positive() }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    const { data: s } = await admin.from("mf_schemes").select("scheme_name, category").eq("scheme_code", data.code).maybeSingle();
    if (!s) return { ok: false, error: "Fund not found" };
    const { guide, proxy } = await benchmarkFor(admin, s.category ?? "");
    if (!proxy) return { ok: false, error: `No benchmark proxy found for ${s.category}`, guide };
    if (!proxy.history_points) {
      const r = await fetch(`https://api.mfapi.in/mf/${proxy.scheme_code}`);
      const j = r.ok ? ((await r.json()) as { data?: { date: string; nav: string }[] }) : {};
      const pts = (j.data ?? []).map((p) => { const [dd, mm, yy] = p.date.split("-"); return { scheme_code: proxy.scheme_code, nav_date: `${yy}-${mm}-${dd}`, nav: Number(p.nav) }; }).filter((p) => p.nav > 0);
      for (let i = 0; i < pts.length; i += 2000) await admin.from("mf_nav_history").upsert(pts.slice(i, i + 2000), { onConflict: "scheme_code,nav_date" });
      await admin.from("mf_schemes").update({ history_points: pts.length, history_synced_at: new Date().toISOString() }).eq("scheme_code", proxy.scheme_code);
    }
    const [fund, bench] = await Promise.all([loadNav(admin, data.code), loadNav(admin, proxy.scheme_code)]);
    return { ok: true, error: null, benchmark: guide?.benchmark_name, proxy,
      rolling: { "1y": rollingVsBenchmark(fund, bench, 1), "3y": rollingVsBenchmark(fund, bench, 3), "5y": rollingVsBenchmark(fund, bench, 5) } };
  });

/** Read model for supporting pages: category guide, AMFI monthly flows, latest daily debt measures. */
export const getDepositoryOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as Ctx).supabase;
    const [guide, monthly, industry, watchDate] = await Promise.all([
      sb.from("mf_category_guide").select("*").order("asset_class"),
      sb.from("mf_amfi_monthly").select("*").order("month", { ascending: false }).limit(500),
      sb.from("mf_amfi_industry_monthly").select("*").order("month", { ascending: false }).limit(36),
      sb.from("mf_daily_fund_watch").select("as_of").order("as_of", { ascending: false }).limit(1),
    ]);
    const asOf = watchDate.data?.[0]?.as_of ?? null;
    const watch = asOf ? await sb.from("mf_daily_fund_watch").select("*").eq("as_of", asOf).order("aum_cr", { ascending: false }).limit(2000) : { data: [] };
    return { guide: guide.data ?? [], monthly: monthly.data ?? [], industry: industry.data ?? [], watchAsOf: asOf, watch: watch.data ?? [] };
  });

/** Paged view of the latest imported AMC snapshot, kept private to the admin. */
export const getFundWatchRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ category: z.string().max(120).optional(), search: z.string().max(120).default(""), page: z.number().int().min(0).max(500).default(0) }).parse(d))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const sb = ctx.supabase;
    const { data: latest } = await sb.from("mf_daily_fund_watch").select("as_of").order("as_of", { ascending: false }).limit(1);
    const asOf = latest?.[0]?.as_of ?? null;
    if (!asOf) return { asOf: null, total: 0, categories: [], rows: [] };

    let query = sb.from("mf_daily_fund_watch").select("*", { count: "exact" }).eq("as_of", asOf);
    if (data.category) query = query.eq("sheet_category", data.category);
    if (data.search.trim()) query = query.ilike("scheme_name", `%${data.search.trim()}%`);
    const [{ data: rows, count }, { data: categoryRows }] = await Promise.all([
      query.order("aum_cr", { ascending: false, nullsFirst: false }).order("scheme_name").range(data.page * 50, data.page * 50 + 49),
      sb.from("mf_daily_fund_watch").select("sheet_category").eq("as_of", asOf).order("sheet_category").limit(5000),
    ]);
    const categoryNames = new Set<string>();
    for (const row of categoryRows ?? []) {
      if (typeof row !== "object" || row === null || !("sheet_category" in row)) continue;
      const category = row.sheet_category;
      if (typeof category === "string" && category.trim()) categoryNames.add(category);
    }
    const categories = [...categoryNames];
    return { asOf, total: count ?? 0, categories, rows: rows ?? [] };
  });

/** The latest AMFI monthly category and industry figures for the private workspace. */
export const getAmfiMonthlyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as Ctx;
    const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const [monthly, industry] = await Promise.all([
      ctx.supabase.from("mf_amfi_monthly").select("*").order("month", { ascending: false }).order("category").limit(200),
      ctx.supabase.from("mf_amfi_industry_monthly").select("*").order("month", { ascending: false }).limit(12),
    ]);
    return { monthly: monthly.data ?? [], industry: industry.data ?? [] };
  });
