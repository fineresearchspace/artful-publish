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

type RangeKey = "1m" | "3m" | "1y" | "5y";
type HistoryPoint = { date: string; price: number; volume: number | null };
type HistoryResponse = { currency?: string; points?: HistoryPoint[] };

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

function formatDate(date: string, range: RangeKey) {
  return new Intl.DateTimeFormat("en", range === "5y" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));
}

function compactVolume(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function MarketHistoryChart({ symbol, name }: { symbol: string; name: string }) {
  const [range, setRange] = useState<RangeKey>("1y");
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setHistory(null);
    setFailed(false);
    fetch(`/api/market-history?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<HistoryResponse>;
      })
      .then(setHistory)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      });
    return () => controller.abort();
  }, [symbol, range]);

  const points = history?.points ?? [];
  const hasVolume = useMemo(() => points.some((point) => typeof point.volume === "number" && point.volume > 0), [points]);
  const firstPrice = points[0]?.price;
  const lastPrice = points[points.length - 1]?.price;
  const periodChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : null;

  return (
    <div className="mt-8 border-t-2 border-ink pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-editorial-ui text-[10px] font-semibold uppercase text-muted-foreground">Price history</p>
          <div className="mt-1 flex items-baseline gap-3">
            <h2 className="display-font text-2xl text-ink sm:text-3xl">{name}</h2>
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

      {failed ? (
        <div className="mt-6 flex h-64 items-center justify-center border-y border-border text-sm text-muted-foreground">Price history is temporarily unavailable.</div>
      ) : !history ? (
        <div className="mt-6 h-64 animate-pulse rounded-md bg-muted" aria-hidden="true" />
      ) : (
        <>
          <div className="mt-6 h-72 w-full" aria-label={`${name} price line chart`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={(value: string) => formatDate(value, range)} minTickGap={36} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={["auto", "auto"]} width={62} tickFormatter={(value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(value) => formatDate(String(value), range)} formatter={(value) => [`${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 4 })}${history.currency ? ` ${history.currency}` : ""}`, "Close"]} contentStyle={{ background: "var(--paper)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--ink)" }} />
                <Area type="monotone" dataKey="price" stroke="var(--primary)" fill="var(--accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "var(--primary)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {hasVolume ? (
            <div className="mt-3 h-28 w-full" aria-label={`${name} reported volume chart`}>
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
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Volume is not reported for this market.</p>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">Daily close prices; weekly points in the five-year view. Volume appears only when reported by the source.</p>
        </>
      )}
    </div>
  );
}