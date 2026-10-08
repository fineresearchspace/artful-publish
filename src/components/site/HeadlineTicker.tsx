import { useEffect, useState } from "react";
import { yieldChangePercent } from "@/lib/header-rules";

type Tick = { label: string; value: number | null; changePct: number | null; yield?: boolean };
type Quote = { symbol: string; latest_price: number | null; change_percent: number | null; available: boolean; last_updated?: string };
type MarketPayload = { data?: Quote[] };
const INITIAL: Tick[] = ["Nifty 50", "Sensex", "S&P 500", "India 10Y yield", "USD/INR", "Brent crude", "Gold"].map((label) => ({ label, value: null, changePct: null, yield: label === "India 10Y yield" }));
const MARKET_API = "https://weekly-wonders-market.onrender.com/api/markets/region";

export function HeadlineTicker() {
  const [ticks, setTicks] = useState(INITIAL);
  const [asOf, setAsOf] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    async function read<T>(url: string): Promise<T | null> {
      try {
        const response = await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(18000)]) });
        return response.ok ? await response.json() as T : null;
      } catch { return null; }
    }
    const update = (index: number, value: number | null, changePct: number | null) => {
      if (controller.signal.aborted) return;
      setTicks((current) => current.map((tick, i) => i === index ? { ...tick, value, changePct } : tick));
    };
    const load = () => {
      for (const [region, symbols] of [ ["india", [["^NSEI", 0], ["^BSESN", 1]]], ["us", [["^GSPC", 2]]], ["commodities", [["BZ=F", 5], ["GC=F", 6]]] ] as const) {
        void read<MarketPayload>(`${MARKET_API}/${region}`).then((payload) => {
          for (const [symbol, index] of symbols) {
            const quote = payload?.data?.find((item) => item.symbol === symbol && item.available);
            if (!quote) continue;
            update(index, quote.latest_price, quote.change_percent);
            if (quote.last_updated && !controller.signal.aborted) setAsOf((current) => !current || Date.parse(quote.last_updated ?? "") < Date.parse(current) ? quote.last_updated : current);
          }
        });
      }
      void read<{ pairs: Array<{ pair: string; rate: number; changePct: number | null }> }>("/api/fx").then((payload) => {
        const fx = payload?.pairs.find((item) => item.pair === "USD/INR");
        if (fx) update(4, fx.rate, fx.changePct);
      });
      void read<{ countries: Array<{ country: string; rates: { "10Y"?: { yield: number; changeBps: number | null } } }> }>("/api/bonds").then((payload) => {
        const point = payload?.countries.find((item) => item.country === "India")?.rates["10Y"];
        if (point) update(3, point.yield, yieldChangePercent(point.yield, point.changeBps));
      });
    };
    load();
    const interval = window.setInterval(load, 300000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, []);

  return (
    <div className="market-ticker border-b border-border bg-paper" aria-label="Market ticker">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="shrink-0 font-editorial-ui text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-chart-2" />LIVE</span>
          <span className="block whitespace-nowrap text-[10px]">as of {asOf ? new Date(asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "—"}</span>
        </div>
        <div className="ticker-mask min-w-0 flex-1 overflow-hidden py-3">
          <div className="ticker-track">
            {[0, 1].map((copy) => <span key={copy} aria-hidden={copy === 1} className="inline-flex items-center">
              {ticks.map((tick) => <span key={tick.label} className="inline-flex items-baseline gap-2 pr-8 font-editorial-ui text-xs">
                <span className="text-muted-foreground">{tick.label}</span>
                <span className="font-semibold tabular-nums text-ink">{tick.value === null ? "—" : tick.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{tick.value !== null && tick.yield ? "%" : ""}</span>
                <span className={`tabular-nums ${tick.changePct === null ? "text-muted-foreground" : tick.changePct >= 0 ? "text-chart-2" : "text-destructive"}`}>{tick.changePct === null ? "—" : `${tick.changePct >= 0 ? "▲" : "▼"} ${Math.abs(tick.changePct).toFixed(2)}%`}</span>
              </span>)}
            </span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
