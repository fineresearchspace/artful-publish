import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

const MARKET_API = "https://weekly-wonders-market.onrender.com";

type MarketQuote = {
  name: string;
  symbol: string;
  latest_price: number | null;
  change_percent: number | null;
  available: boolean;
};

type MarketResponse = { data?: MarketQuote[] };

const MARKET_ORDER = [
  { region: "India", labels: ["NIFTY 50", "NIFTY50", "Sensex", "SENSEX"] },
  { region: "US", labels: ["S&P 500", "SPX", "Nasdaq 100", "NASDAQ"] },
];

function chooseQuotes(india: MarketQuote[], us: MarketQuote[]) {
  const pools = { India: india, US: us };
  return MARKET_ORDER.flatMap(({ region, labels }) => {
    const pool = pools[region as keyof typeof pools];
    const selected: MarketQuote[] = [];
    for (const label of labels) {
      const match = pool.find(
        (quote) =>
          quote.available &&
          !selected.includes(quote) &&
          (quote.name.toLowerCase() === label.toLowerCase() ||
            quote.symbol.toLowerCase() === label.toLowerCase()),
      );
      if (match) selected.push(match);
      if (selected.length === 2) break;
    }
    if (selected.length < 2) {
      selected.push(
        ...pool.filter((quote) => quote.available && !selected.includes(quote)).slice(0, 2 - selected.length),
      );
    }
    return selected.map((quote) => ({ ...quote, region }));
  });
}

function formatIndexValue(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

export function HomeMarketSnapshot() {
  const [quotes, setQuotes] = useState<Array<MarketQuote & { region: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);

    Promise.all([
      fetch(`${MARKET_API}/api/markets/region/india`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<MarketResponse>;
      }),
      fetch(`${MARKET_API}/api/markets/region/us`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<MarketResponse>;
      }),
    ])
      .then(([india, us]) => setQuotes(chooseQuotes(india.data ?? [], us.data ?? [])))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <section className="border-b border-border bg-paper" aria-labelledby="market-snapshot-title">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="pixel-font text-[9px] text-primary">Market Pulse</p>
            <h2 id="market-snapshot-title" className="display-font mt-1 text-2xl text-ink">
              India + US at a glance
            </h2>
          </div>
          <Link
            to="/Market-Pulse"
            className="font-editorial-ui inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            Full pulse <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[82px] animate-pulse bg-muted" />
            ))}
          </div>
        ) : quotes.length ? (
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
            {quotes.map((quote) => {
              const change = quote.change_percent ?? 0;
              const rising = change >= 0;
              return (
                <div key={`${quote.region}-${quote.symbol}`} className="min-w-0 bg-paper px-4 py-3.5">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate font-editorial-ui text-xs font-semibold text-ink">{quote.name}</p>
                    <span className="pixel-font shrink-0 text-[8px] text-muted-foreground">{quote.region}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-editorial-ui text-base font-semibold tabular-nums text-ink">
                      {formatIndexValue(quote.latest_price)}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-semibold tabular-nums ${rising ? "text-primary" : "text-destructive"}`}
                    >
                      {rising ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {Math.abs(change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 px-4 py-4">
            <p className="text-sm text-muted-foreground">Live index quotes are refreshing.</p>
            <Link to="/Market-Pulse" className="shrink-0 text-xs font-semibold text-primary hover:underline">
              View markets
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

type BondPoint = { yield: number; changeBps: number | null };
type CountryBonds = {
  country: string;
  rates: Partial<Record<"2Y" | "10Y" | "30Y", BondPoint>>;
};
type BondResponse = { countries?: CountryBonds[]; asOf?: string };

const MATURITIES = ["2Y", "10Y", "30Y"] as const;

function YieldCell({ point }: { point?: BondPoint }) {
  if (!point) return <span className="text-muted-foreground">—</span>;
  const rising = (point.changeBps ?? 0) >= 0;
  return (
    <div>
      <span className="font-editorial-ui text-sm font-semibold tabular-nums text-ink">{point.yield.toFixed(2)}%</span>
      {point.changeBps !== null ? (
        <span className={`ml-2 text-[10px] tabular-nums ${rising ? "text-primary" : "text-destructive"}`}>
          {rising ? "+" : ""}{point.changeBps}bp
        </span>
      ) : null}
    </div>
  );
}

export function HomeBondSnapshot() {
  const [data, setData] = useState<BondResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/bonds", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<BondResponse>;
      })
      .then(setData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="bond-snapshot-title">
      <div className="grid gap-6 border-b-2 border-ink pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className="pixel-font text-[10px] text-primary">Fixed income</p>
          <h2 id="bond-snapshot-title" className="display-font mt-2 text-3xl text-ink sm:text-4xl">
            Sovereign yield watch
          </h2>
          <p className="mt-2 max-w-2xl font-serif text-base text-muted-foreground">
            Live 2-year, 10-year and 30-year government bond yields across major economies.
          </p>
        </div>
        <span className="font-editorial-ui text-[10px] uppercase text-muted-foreground">
          {data?.asOf ? `As of ${data.asOf}` : "Live market data"}
        </span>
      </div>

      {failed ? (
        <div className="border-b border-border py-6 text-sm text-muted-foreground">
          Bond yields are temporarily unavailable.
        </div>
      ) : !data ? (
        <div className="space-y-px bg-border" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-5 font-editorial-ui text-[10px] uppercase text-muted-foreground">Economy</th>
                {MATURITIES.map((maturity) => (
                  <th key={maturity} className="px-5 py-3 font-editorial-ui text-[10px] uppercase text-muted-foreground">
                    {maturity} yield
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.countries ?? []).map((country) => (
                <tr key={country.country} className="border-b border-border transition-colors hover:bg-accent/30">
                  <th className="py-4 pr-5 font-editorial-ui text-sm font-semibold text-ink">{country.country}</th>
                  {MATURITIES.map((maturity) => (
                    <td key={maturity} className="px-5 py-4"><YieldCell point={country.rates[maturity]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">Yield changes shown in basis points where available.</p>
    </section>
  );
}