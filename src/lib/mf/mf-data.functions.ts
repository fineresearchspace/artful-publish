import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseAmfiNavAll, dmyDate } from "./amfi-parse";

type Ctx = { supabase: any; userId: string };
async function assertAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const AMFI_URLS = ["https://portal.amfiindia.com/spages/NAVAll.txt", "https://www.amfiindia.com/spages/NAVAll.txt"];

/** Pulls the full AMFI scheme master + latest NAV and upserts every scheme. */
export const syncAmfiSchemes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context as Ctx);
    let text = "";
    for (const url of AMFI_URLS) {
      try {
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 TheContext/1.0" } });
        if (r.ok) { text = await r.text(); if (text.length > 1000) break; }
      } catch { /* try next */ }
    }
    const rows = parseAmfiNavAll(text);
    if (!rows.length) {
      await admin.from("mf_sync_runs").insert({ kind: "amfi_master", ok: false, detail: "AMFI file unavailable" });
      return { ok: false, written: 0, error: "AMFI file unavailable" };
    }
    const now = new Date().toISOString();
    let written = 0;
    for (let i = 0; i < rows.length; i += 1000) {
      const chunk = rows.slice(i, i + 1000).map((r) => ({ ...r, updated_at: now }));
      const { error } = await admin.from("mf_schemes").upsert(chunk, { onConflict: "scheme_code" });
      if (error) {
        await admin.from("mf_sync_runs").insert({ kind: "amfi_master", ok: false, rows_written: written, detail: error.message });
        return { ok: false, written, error: "Database write failed" };
      }
      written += chunk.length;
    }
    await admin.from("mf_sync_runs").insert({ kind: "amfi_master", rows_written: written, detail: `${written} schemes` });
    return { ok: true, written, error: null };
  });

/** Pulls full NAV history from mfapi.in for up to 25 schemes in a category (or explicit codes). */
export const syncNavHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    category: z.string().max(200).optional(),
    codes: z.array(z.number().int().positive()).max(25).optional(),
    directGrowthOnly: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context as Ctx);
    let codes = data.codes ?? [];
    if (!codes.length && data.category) {
      let q = admin.from("mf_schemes").select("scheme_code, plan, option_type, scheme_name")
        .eq("category", data.category).order("history_synced_at", { ascending: true, nullsFirst: true }).limit(300);
      const { data: list } = await q;
      codes = (list ?? []).filter((s: any) => !data.directGrowthOnly ||
        (/direct/i.test(`${s.plan} ${s.scheme_name}`) && /growth/i.test(`${s.option_type} ${s.scheme_name}`) && !/idcw|dividend/i.test(s.scheme_name)))
        .slice(0, 25).map((s: any) => s.scheme_code);
    }
    const results: { code: number; points: number; gaps: number; error?: string }[] = [];
    for (const code of codes) {
      try {
        const r = await fetch(`https://api.mfapi.in/mf/${code}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { data?: { date: string; nav: string }[] };
        const pts = (j.data ?? []).map((p) => ({ scheme_code: code, nav_date: dmyDate(p.date), nav: Number(p.nav) }))
          .filter((p) => p.nav_date && Number.isFinite(p.nav) && p.nav > 0)
          .sort((a, b) => (a.nav_date! < b.nav_date! ? -1 : 1));
        for (let i = 0; i < pts.length; i += 2000) {
          const { error } = await admin.from("mf_nav_history").upsert(pts.slice(i, i + 2000), { onConflict: "scheme_code,nav_date" });
          if (error) throw new Error(error.message);
        }
        // gaps: calendar jumps > 7 days between consecutive NAVs
        let gaps = 0;
        for (let i = 1; i < pts.length; i++) {
          if ((Date.parse(pts[i]!.nav_date!) - Date.parse(pts[i - 1]!.nav_date!)) / 864e5 > 7) gaps++;
        }
        await admin.from("mf_schemes").update({
          history_synced_at: new Date().toISOString(), history_points: pts.length, history_start: pts[0]?.nav_date ?? null,
        }).eq("scheme_code", code);
        results.push({ code, points: pts.length, gaps });
      } catch (e) {
        results.push({ code, points: 0, gaps: 0, error: e instanceof Error ? e.message : "failed" });
      }
    }
    const total = results.reduce((a, r) => a + r.points, 0);
    await admin.from("mf_sync_runs").insert({ kind: "nav_history", rows_written: total, ok: results.every((r) => !r.error),
      detail: `${data.category ?? "codes"}: ${results.length} schemes` });
    return { results, total };
  });

/** Overview for the private research page. */
export const getMfOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as Ctx).supabase;
    const [{ count: schemes }, { count: withHistory }, { data: runs }, { data: cats }] = await Promise.all([
      sb.from("mf_schemes").select("*", { count: "exact", head: true }),
      sb.from("mf_schemes").select("*", { count: "exact", head: true }).gt("history_points", 0),
      sb.from("mf_sync_runs").select("*").order("created_at", { ascending: false }).limit(8),
      Promise.resolve({ data: null }),
    ]);
    const all: { category: string }[] = [];
    for (let from = 0; from < 30000; from += 1000) {
      const { data: page } = await sb.from("mf_schemes").select("category").not("category", "is", null).range(from, from + 999);
      all.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }
    const counts = new Map<string, number>();
    void cats;
    for (const c of all) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    const categories = [...counts.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => a.name.localeCompare(b.name));
    const { data: synced } = await sb.from("mf_schemes")
      .select("scheme_code, scheme_name, fund_house, category, latest_nav, nav_date, history_points, history_start, history_synced_at")
      .gt("history_points", 0).order("history_synced_at", { ascending: false }).limit(50);
    return { schemes: schemes ?? 0, withHistory: withHistory ?? 0, runs: runs ?? [], categories, synced: synced ?? [] };
  });
