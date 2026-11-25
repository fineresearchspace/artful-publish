import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getMfOverview, syncAmfiSchemes, syncNavHistory } from "@/lib/mf/mf-data.functions";

export const Route = createFileRoute("/_authenticated/admin/mf-data")({
  head: () => ({ meta: [{ title: "MF Data — The Context Studio" }, { name: "robots", content: "noindex" }] }),
  component: MfDataPage,
});

function MfDataPage() {
  const qc = useQueryClient();
  const overviewFn = useServerFn(getMfOverview);
  const masterFn = useServerFn(syncAmfiSchemes);
  const historyFn = useServerFn(syncNavHistory);
  const { data, isLoading } = useQuery({ queryKey: ["mf-overview"], queryFn: () => overviewFn() });
  const [busy, setBusy] = useState<string | null>(null);
  const [category, setCategory] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["mf-overview"] });
  async function runMaster() {
    setBusy("master");
    try {
      const r = await masterFn();
      r.ok ? toast.success(`Saved ${r.written.toLocaleString()} schemes from AMFI`) : toast.error(r.error ?? "Failed");
    } catch { toast.error("Sync failed"); }
    setBusy(null); refresh();
  }
  async function runHistory() {
    if (!category) { toast.error("Pick a category"); return; }
    setBusy("history");
    try {
      const r = await historyFn({ data: { category, directGrowthOnly: true } });
      const failed = r.results.filter((x) => x.error).length;
      toast.success(`${r.results.length} funds, ${r.total.toLocaleString()} NAV points${failed ? `, ${failed} failed` : ""}`);
    } catch { toast.error("History sync failed"); }
    setBusy(null); refresh();
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Private research</p>
        <h1 className="font-display text-4xl">Mutual fund data</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Official AMFI scheme list and daily NAVs, plus full NAV history per fund. Visible only to you.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Schemes stored" value={isLoading ? "…" : data?.schemes.toLocaleString() ?? "0"} />
        <Stat label="Funds with full history" value={isLoading ? "…" : data?.withHistory.toLocaleString() ?? "0"} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="font-display text-2xl">1. Fund list from AMFI</h2>
          <p className="text-sm text-muted-foreground">Fetches every scheme with its category, fund house and latest NAV.</p>
          <button onClick={runMaster} disabled={!!busy} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
            {busy === "master" ? "Fetching…" : "Refresh fund list"}
          </button>
        </div>
        <div className="border-t border-border pt-4">
          <h2 className="font-display text-2xl">2. NAV history by category</h2>
          <p className="text-sm text-muted-foreground">Pulls full history for up to 25 Direct-Growth funds per click (oldest-synced first). Click again for the next batch.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[280px] rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Choose a category…</option>
              {data?.categories.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.n})</option>)}
            </select>
            <button onClick={runHistory} disabled={!!busy || !category} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {busy === "history" ? "Pulling history…" : "Pull history"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl mb-3">Funds with history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-left font-mono text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">Fund</th><th>Category</th><th>NAV</th><th>Since</th><th>Points</th></tr>
            </thead>
            <tbody>
              {data?.synced.map((s: any) => (
                <tr key={s.scheme_code} className="border-t border-border">
                  <td className="py-2 pr-3">{s.scheme_name}<div className="text-xs text-muted-foreground">{s.fund_house}</div></td>
                  <td className="pr-3 text-xs">{s.category?.replace(/^.*? - /, "")}</td>
                  <td className="pr-3">{s.latest_nav ?? "—"}</td>
                  <td className="pr-3">{s.history_start ?? "—"}</td>
                  <td>{s.history_points.toLocaleString()}</td>
                </tr>
              ))}
              {!data?.synced.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No history yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl mb-3">Recent syncs</h2>
        <ul className="space-y-1 text-sm">
          {data?.runs.map((r: any) => (
            <li key={r.id} className="flex justify-between gap-3 border-t border-border py-1.5">
              <span>{r.ok ? "✓" : "✕"} {r.kind === "amfi_master" ? "Fund list" : "NAV history"} — {r.detail}</span>
              <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{value}</p>
    </div>
  );
}
