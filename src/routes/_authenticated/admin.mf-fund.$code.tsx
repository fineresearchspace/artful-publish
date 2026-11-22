import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getFundDetail, syncFundNews, saveFactsheet, computeReturnMetrics } from "@/lib/mf/mf-research.functions";

export const Route = createFileRoute("/_authenticated/admin/mf-fund/$code")({
  head: () => ({ meta: [{ title: "Fund research — The Context Studio" }, { name: "robots", content: "noindex" }] }),
  component: FundPage,
});

const pct = (v: unknown) => (v == null ? "—" : `${Number(v).toFixed(2)}%`);
const SAMPLE = `{
  "as_of": "2026-10-31", "aum_cr": 0, "expense_ratio": 0, "benchmark": "",
  "managers": [{ "name": "", "start_date": "2020-01-01" }],
  "holdings": [{ "instrument": "", "sector": "", "weight_pct": 0 }]
}`;

function FundPage() {
  const code = Number(Route.useParams().code);
  const qc = useQueryClient();
  const fn = useServerFn(getFundDetail); const newsFn = useServerFn(syncFundNews); const saveFn = useServerFn(saveFactsheet); const calc = useServerFn(computeReturnMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["mf-fund", code], queryFn: () => fn({ data: { code } }) });
  const [json, setJson] = useState(SAMPLE); const [busy, setBusy] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["mf-fund", code] });
  const [filter, setFilter] = useState<"all" | "news" | "reddit" | "twitter">("all");

  async function pullNews() {
    setBusy("news");
    try { const r = await newsFn({ data: { code } }); const c = r.counts as any;
      toast.success(`News ${c.news ?? 0} · Reddit ${c.reddit ?? 0} · X ${c.twitter ?? 0}`);
      if ((r.status as any).twitter && (r.status as any).twitter !== "ok") toast.message((r.status as any).twitter); }
    catch { toast.error("News fetch failed"); }
    setBusy(null); refresh();
  }
  async function save() {
    setBusy("fs");
    try { const parsed = JSON.parse(json); const r = await saveFn({ data: { ...parsed, scheme_code: code } }); r.ok ? toast.success("Factsheet saved") : toast.error(r.error ?? "Failed"); }
    catch (e) { toast.error(e instanceof SyntaxError ? "Invalid JSON" : "Check the fields and try again"); }
    setBusy(null); refresh();
  }
  async function recalc() { setBusy("calc"); try { await calc({ data: { codes: [code] } }); toast.success("Returns updated"); } catch { toast.error("Failed"); } setBusy(null); refresh(); }

  if (isLoading || !data) return <p>Loading…</p>;
  const m: any = data.metrics; const fs: any = data.factsheets[0];
  const news = data.news.filter((n: any) => filter === "all" || n.source_type === filter);
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{data.scheme?.fund_house} · {data.scheme?.category}</p>
        <h1 className="font-display text-3xl">{data.scheme?.scheme_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">NAV {data.scheme?.latest_nav} on {data.scheme?.nav_date} · {data.nav.length.toLocaleString()} history points</p>
      </header>

      <Section title="Return analysis" action={<Btn onClick={recalc} busy={busy === "calc"}>Recalculate</Btn>}>
        {!m ? <p className="text-sm text-muted-foreground">Not calculated yet.</p> : (
          <div className="grid gap-3 sm:grid-cols-4">
            {[["1M", m.r_1m], ["3M", m.r_3m], ["6M", m.r_6m], ["1Y", m.r_1y], ["3Y CAGR", m.r_3y], ["5Y CAGR", m.r_5y], ["10Y CAGR", m.r_10y], ["Since launch", m.r_since],
              ["1Y rolling avg", m.rolling_1y_avg], ["1Y rolling min", m.rolling_1y_min], ["1Y rolling max", m.rolling_1y_max], ["1Y rolling positive", m.rolling_1y_pos_pct],
              ["3Y rolling avg", m.rolling_3y_avg], ["3Y rolling min", m.rolling_3y_min], ["Volatility 1Y", m.volatility_1y], ["Max drawdown", m.max_drawdown]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg border border-border p-3"><p className="font-mono text-xs uppercase text-muted-foreground">{l}</p><p className="text-lg">{pct(v)}</p></div>
            ))}
            <div className="rounded-lg border border-border p-3"><p className="font-mono text-xs uppercase text-muted-foreground">Sharpe / Sortino 3Y</p><p className="text-lg">{m.sharpe_3y ?? "—"} / {m.sortino_3y ?? "—"}</p></div>
          </div>
        )}
      </Section>

      <Section title="Factsheet">
        {!fs ? <p className="text-sm text-muted-foreground">No factsheet saved yet.</p> : (
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            {Object.entries({ "As of": fs.as_of, "AUM (Cr)": fs.aum_cr, "Expense ratio": fs.expense_ratio, Benchmark: fs.benchmark, "Exit load": fs.exit_load, Turnover: fs.turnover_ratio,
              Beta: fs.beta, "P/E": fs.pe, YTM: fs.ytm, "Mod. duration": fs.modified_duration, "Equity %": fs.equity_pct, "Debt %": fs.debt_pct, "Cash %": fs.cash_pct,
              "Large/Mid/Small": [fs.large_cap_pct, fs.mid_cap_pct, fs.small_cap_pct].map((x) => x ?? "—").join(" / ") })
              .map(([k, v]) => <div key={k}><dt className="font-mono text-xs uppercase text-muted-foreground">{k}</dt><dd>{v ?? "—"}</dd></div>)}
          </dl>
        )}
      </Section>

      <Section title="Fund manager history">
        {!data.managers.length ? <p className="text-sm text-muted-foreground">No managers recorded.</p> : (
          <ul className="space-y-1 text-sm">{data.managers.map((x: any, i: number) => (
            <li key={i}>{x.mf_managers?.name} — {x.start_date ?? "?"} to {x.end_date ?? "present"}{x.mf_managers?.experience_years ? ` · ${x.mf_managers.experience_years} yrs exp.` : ""}</li>))}</ul>
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Top holdings">
          {!data.holdings.length ? <p className="text-sm text-muted-foreground">No holdings saved.</p> : (
            <ul className="space-y-1 text-sm">{data.holdings.slice(0, 15).map((h: any) => <li key={h.id} className="flex justify-between gap-2"><span>{h.instrument}</span><span>{h.weight_pct}%</span></li>)}</ul>)}
        </Section>
        <Section title="Sector allocation">
          {!data.sectors.length ? <p className="text-sm text-muted-foreground">No sector data.</p> : (
            <ul className="space-y-2 text-sm">{data.sectors.map((s: any) => (
              <li key={s.sector}><div className="flex justify-between"><span>{s.sector}</span><span>{s.weight_pct}%</span></div>
                <div className="mt-1 h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, s.weight_pct)}%` }} /></div></li>))}</ul>)}
        </Section>
      </div>

      <Section title="Add factsheet snapshot" action={<Btn onClick={save} busy={busy === "fs"}>Save</Btn>}>
        <p className="mb-2 text-sm text-muted-foreground">Paste the month's factsheet as JSON. Sectors are worked out from holdings if you leave them out.</p>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={10} className="w-full rounded-md border border-border bg-background p-3 font-mono text-xs" />
      </Section>

      <Section title="What's happening with this fund" action={<Btn onClick={pullNews} busy={busy === "news"}>Fetch latest</Btn>}>
        <div className="mb-3 flex gap-2">{(["all", "news", "reddit", "twitter"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{f === "twitter" ? "Twitter/X" : f[0]!.toUpperCase() + f.slice(1)}</button>))}</div>
        {!news.length ? <p className="text-sm text-muted-foreground">Nothing yet.</p> : (
          <ul className="space-y-3">{news.map((n: any) => (
            <li key={n.id} className="border-b border-border pb-2 last:border-0">
              <a href={n.url} target="_blank" rel="noreferrer" className="text-sm hover:underline">{n.title}</a>
              <p className="font-mono text-xs text-muted-foreground">{n.source_name} · {n.published_at ? new Date(n.published_at).toLocaleDateString("en-IN") : ""}</p>
            </li>))}</ul>)}
      </Section>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-2xl">{title}</h2>{action}</div>{children}</section>;
}
function Btn({ onClick, busy, children }: { onClick: () => void; busy: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">{busy ? "Working…" : children}</button>;
}
