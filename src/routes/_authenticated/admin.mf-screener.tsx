import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getScreener, computeReturnMetrics } from "@/lib/mf/mf-research.functions";

export const Route = createFileRoute("/_authenticated/admin/mf-screener")({
  head: () => ({ meta: [{ title: "MF Screener — The Context Studio" }, { name: "robots", content: "noindex" }] }),
  component: Screener,
});

const pct = (v: unknown) => (v == null ? "—" : `${Number(v).toFixed(2)}%`);
const SORTS = [["r_3y", "3Y CAGR"], ["r_1y", "1Y"], ["r_5y", "5Y CAGR"], ["rolling_3y_avg", "3Y rolling avg"], ["sharpe_3y", "Sharpe 3Y"], ["volatility_1y", "Lowest volatility"]] as const;

function Screener() {
  const qc = useQueryClient();
  const fn = useServerFn(getScreener); const calc = useServerFn(computeReturnMetrics);
  const [search, setSearch] = useState(""); const [sort, setSort] = useState<(typeof SORTS)[number][0]>("r_3y");
  const { data, isLoading } = useQuery({ queryKey: ["mf-screener", search, sort], queryFn: () => fn({ data: { search: search || undefined, sort } }) });
  const [busy, setBusy] = useState(false);
  async function recompute() {
    setBusy(true);
    try { const r = await calc({ data: {} }); toast.success(`Calculated returns for ${r.computed} funds`); qc.invalidateQueries({ queryKey: ["mf-screener"] }); }
    catch { toast.error("Calculation failed"); }
    setBusy(false);
  }
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Private research</p>
        <h1 className="font-display text-4xl">Fund screener</h1>
        <p className="mt-2 text-sm text-muted-foreground">Funds with stored NAV history. Returns under 1 year are absolute; 1 year and above are CAGR.</p>
      </header>
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fund" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={recompute} disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busy ? "Calculating…" : "Recalculate returns"}</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="font-mono text-xs uppercase text-muted-foreground"><tr className="border-b border-border">
            {["Fund", "Category", "1Y", "3Y", "5Y", "3Y rolling avg", "Sharpe 3Y", "Max DD", "AUM (Cr)", "TER"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td className="px-3 py-4" colSpan={10}>Loading…</td></tr>}
            {!isLoading && !data?.rows.length && <tr><td className="px-3 py-4 text-muted-foreground" colSpan={10}>No calculated funds yet. Sync NAV history in MF Data, then press Recalculate returns.</td></tr>}
            {data?.rows.map((r: any) => (
              <tr key={r.scheme_code} className="border-b border-border last:border-0">
                <td className="px-3 py-2"><Link to="/admin/mf-fund/$code" params={{ code: String(r.scheme_code) }} className="text-primary hover:underline">{r.mf_schemes.scheme_name}</Link></td>
                <td className="px-3 py-2 text-muted-foreground">{r.mf_schemes.category}</td>
                <td className="px-3 py-2">{pct(r.r_1y)}</td><td className="px-3 py-2">{pct(r.r_3y)}</td><td className="px-3 py-2">{pct(r.r_5y)}</td>
                <td className="px-3 py-2">{pct(r.rolling_3y_avg)}</td><td className="px-3 py-2">{r.sharpe_3y ?? "—"}</td><td className="px-3 py-2">{pct(r.max_drawdown)}</td>
                <td className="px-3 py-2">{r.factsheet?.aum_cr ?? "—"}</td><td className="px-3 py-2">{r.factsheet?.expense_ratio != null ? `${r.factsheet.expense_ratio}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
