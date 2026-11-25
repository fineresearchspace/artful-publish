import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

const MARKET_API = "https://weekly-wonders-market.onrender.com";

const INDICES = [
  { key: "nifty50", name: "NIFTY 50", region: "India", aliases: ["NIFTY 50", "NIFTY50", "NIFTY"] },
  { key: "sensex", name: "Sensex", region: "India", aliases: ["Sensex", "SENSEX"] },
  { key: "banknifty", name: "Bank NIFTY", region: "India", aliases: ["NIFTY Bank", "NIFTYBANK", "Bank Nifty"] },
  { key: "sp500", name: "S&P 500", region: "US", aliases: ["S&P 500", "SPX", "GSPC"] },
  { key: "nasdaq100", name: "Nasdaq 100", region: "US", aliases: ["Nasdaq 100", "NASDAQ", "NDX"] },
  { key: "dow", name: "Dow Jones", region: "US", aliases: ["Dow Jones", "DJI", "INDU"] },
  { key: "nikkei225", name: "Nikkei 225", region: "Japan", aliases: ["Nikkei 225", "NIKKEI", "N225"] },
  { key: "dax", name: "DAX", region: "Europe", aliases: ["DAX", "GDAXI"] },
  { key: "ftse100", name: "FTSE 100", region: "Europe", aliases: ["FTSE 100", "FTSE"] },
] as const;

type IndexKey = (typeof INDICES)[number]["key"];
type RangeKey = "1m" | "3m" | "1y" | "5y";
type Quote = { name: string; symbol: string; latest_price: number | null; change_percent: number | null; available: boolean };
type MarketResponse = { data?: Quote[] };
type HistoryPoint = { date: string; price: number; volume: number | null };
type HistoryResponse = { currency?: string; points?: HistoryPoint[] };

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

function same(value: string, aliases: readonly string[]) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return aliases.some((alias) => alias.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized);
}

function heatClass(change: number | null) {
  if (change === null || Math.abs(change) < 0.05) return "bg-muted text-ink";
  if (change >= 1) return "bg-chart-2 text-primary-foreground";
  if (change > 0) return "bg-chart-2/70 text-ink";
  if (change <= -1) return "bg-destructive text-destructive-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

function compactVolume(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(date: string, range: RangeKey) {
  return new Intl.DateTimeFormat("en", range === "5y" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));
}

export function IndexHeatmap() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [selected, setSelected] = useState<IndexKey>("nifty50");
  const [range, setRange] = useState<RangeKey>("1y");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyFailed, setHistoryFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled(
      ["india", "us", "asia", "europe"].map((region) =>
        fetch(`${MARKET_API}/api/markets/region/${region}`, { signal: controller.signal }).then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json() as Promise<MarketResponse>;
        }),
      ),
    ).then((results) => {
      const all = results.flatMap((result) => result.status === "fulfilled" ? result.value.data ?? [] : []);
      const next: Record<string, Quote> = {};
      for (const index of INDICES) {
        const quote = all.find((item) => same(item.name, index.aliases) || same(item.symbol, index.aliases));
        if (quote) next[index.key] = quote;
      }
      setQuotes(next);
      setQuotesLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setHistory(null);
    setHistoryFailed(false);
    fetch(`/api/market-history?symbol=${selected}&range=${range}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<HistoryResponse>;
      })
      .then(setHistory)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHistoryFailed(true);
      });
    return () => controller.abort();
  }, [selected, range]);

  const selectedIndex = INDICES.find((index) => index.key === selected) ?? INDICES[0];
  const points = history?.points ?? [];
  const hasVolume = useMemo(() => points.some((point) => typeof point.volume === "number" && point.volume > 0), [points]);
  const firstPrice = points[0]?.price;
  const lastPrice = points[points.length - 1]?.price;
  const periodChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : null;

  return (
    <section className="border-y border-border bg-paper" aria-labelledby="index-heatmap-title">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-editorial-ui text-[11px] font-semibold uppercase text-primary">Global indices</p>
          <h2 id="index-heatmap-title" className="display-font mt-2 text-3xl text-ink sm:text-4xl">Market heatmap</h2>
          <p className="mt-2 font-serif text-base text-muted-foreground">Select an index to inspect its price history and reported trading volume.</p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {INDICES.map((index) => {
            const quote = quotes[index.key];
            const change = quote?.available ? quote.change_percent : null;
            return (
              <Button
                key={index.key}
                type="button"
                variant="ghost"
                onClick={() => setSelected(index.key)}
                aria-pressed={selected === index.key}
                className={`h-24 min-w-0 flex-col items-start justify-between whitespace-normal rounded-md px-3 py-3 text-left shadow-none ring-offset-2 transition-transform hover:scale-[1.02] hover:text-current focus-visible:ring-2 ${heatClass(change ?? null)} ${selected === index.key ? "ring-2 ring-ink" : ""}`}
              >
                <span className="w-full truncate font-editorial-ui text-sm font-semibold">{index.name}</span>
                <span className="w-full">
                  <span className="block font-editorial-ui text-lg font-semibold tabular-nums">
                    {quote?.latest_price?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? (quotesLoading ? "Loading…" : "—")}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold tabular-nums">
                    {change === null || change === undefined ? index.region : `${change >= 0 ? "+" : ""}${change.toFixed(2)}% · ${index.region}`}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>

        <div className="mt-8 border-t-2 border-ink pt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-editorial-ui text-[10px] font-semibold uppercase text-muted-foreground">Price history</p>
              <div className="mt-1 flex items-baseline gap-3">
                <h3 className="display-font text-2xl text-ink sm:text-3xl">{selectedIndex.name}</h3>
                {periodChange !== null ? (
                  <span className={`text-sm font-semibold tabular-nums ${periodChange >= 0 ? "text-chart-2" : "text-destructive"}`}>
                    {periodChange >= 0 ? "+" : ""}{periodChange.toFixed(2)}%
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-1" aria-label="History range">
              {RANGES.map((item) => (
                <Button key={item.key} type="button" size="sm" variant={range === item.key ? "default" : "outline"} onClick={() => setRange(item.key)} aria-pressed={range === item.key}>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {historyFailed ? (
            <div className="mt-6 flex h-64 items-center justify-center border-y border-border text-sm text-muted-foreground">Price history is temporarily unavailable.</div>
          ) : !history ? (
            <div className="mt-6 h-64 animate-pulse rounded-md bg-muted" aria-hidden="true" />
          ) : (
            <>
              <div className="mt-6 h-72 w-full" aria-label={`${selectedIndex.name} price line chart`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" tickFormatter={(value: string) => formatDate(value, range)} minTickGap={36} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} width={62} tickFormatter={(value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip labelFormatter={(value) => formatDate(String(value), range)} formatter={(value) => [`${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${history.currency ? ` ${history.currency}` : ""}`, "Close"]} contentStyle={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink)" }} />
                    <Area type="monotone" dataKey="price" stroke="var(--primary)" fill="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "var(--primary)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {hasVolume ? (
                <div className="mt-3 h-28 w-full" aria-label={`${selectedIndex.name} reported volume chart`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={points} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis width={62} tickFormatter={compactVolume} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip labelFormatter={(value) => formatDate(String(value), range)} formatter={(value) => [compactVolume(Number(value)), "Volume"]} contentStyle={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink)" }} />
                      <Bar dataKey="volume" fill="var(--chart-5)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Volume is not reported for this index.</p>
              )}
              <p className="mt-3 text-[10px] text-muted-foreground">Daily close prices; weekly points in the five-year view. Volume appears only when reported by the source.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}