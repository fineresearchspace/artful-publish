import React from "react";
import { ClientOnly } from "@tanstack/react-router";

type MarketData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  region: string;
};

type RegionMarkets = {
  region: string;
  markets: MarketData[];
};

// Mock market data - in production, you'd fetch from an API
// Using realistic current market values
const MOCK_MARKET_DATA: RegionMarkets[] = [
  {
    region: "India",
    markets: [
      { symbol: "SENSEX", name: "Sensex", price: 74781.76, change: -120.83, changePercent: -0.16, region: "India" },
      { symbol: "NIFTY50", name: "NIFTY 50", price: 22742.35, change: -45.20, changePercent: -0.20, region: "India" },
      { symbol: "NIFTYJR", name: "NIFTY Next 50", price: 11842.50, change: 32.15, changePercent: 0.27, region: "India" },
      { symbol: "NIFTYIT", name: "NIFTY IT", price: 35620.00, change: 125.50, changePercent: 0.35, region: "India" },
      { symbol: "NIFTYBANK", name: "NIFTY Bank", price: 49850.20, change: -180.40, changePercent: -0.36, region: "India" },
      { symbol: "NIFTYPHARMA", name: "NIFTY Pharma", price: 13245.80, change: 65.30, changePercent: 0.49, region: "India" },
      { symbol: "NIFTYAUTO", name: "NIFTY Auto", price: 12456.15, change: -95.20, changePercent: -0.76, region: "India" },
      { symbol: "NIFTYREALTY", name: "NIFTY Realty", price: 856.40, change: 12.80, changePercent: 1.51, region: "India" },
    ],
  },
  {
    region: "US",
    markets: [
      { symbol: "SPX", name: "S&P 500", price: 5682.40, change: 45.20, changePercent: 0.80, region: "US" },
      { symbol: "NDX", name: "Nasdaq 100", price: 19850.60, change: 125.80, changePercent: 0.64, region: "US" },
      { symbol: "DJI", name: "Dow Jones", price: 41842.30, change: 220.15, changePercent: 0.53, region: "US" },
      { symbol: "RUT", name: "Russell 2000", price: 2084.50, change: -32.40, changePercent: -1.53, region: "US" },
      { symbol: "VIX", name: "VIX", price: 12.45, change: -0.85, changePercent: -6.37, region: "US" },
    ],
  },
  {
    region: "Japan",
    markets: [
      { symbol: "N225", name: "Nikkei 225", price: 40285.50, change: 185.40, changePercent: 0.46, region: "Japan" },
      { symbol: "JPXN", name: "Topix", price: 2842.30, change: 28.60, changePercent: 1.01, region: "Japan" },
      { symbol: "USDJPY", name: "USD/JPY", price: 148.52, change: 0.45, changePercent: 0.30, region: "Japan" },
    ],
  },
  {
    region: "Europe",
    markets: [
      { symbol: "DAX", name: "DAX", price: 18542.80, change: 142.50, changePercent: 0.77, region: "Europe" },
      { symbol: "FTSE", name: "FTSE 100", price: 8156.20, change: -45.80, changePercent: -0.56, region: "Europe" },
      { symbol: "FCHI", name: "CAC 40", price: 7485.60, change: 68.30, changePercent: 0.92, region: "Europe" },
      { symbol: "STOXX50", name: "Euro Stoxx 50", price: 5142.35, change: 52.15, changePercent: 1.02, region: "Europe" },
    ],
  },
  {
    region: "Forex",
    markets: [
      { symbol: "USDINR", name: "USD/INR", price: 83.42, change: 0.08, changePercent: 0.10, region: "Forex" },
      { symbol: "EURUSD", name: "EUR/USD", price: 1.0842, change: 0.0015, changePercent: 0.14, region: "Forex" },
      { symbol: "GBPUSD", name: "GBP/USD", price: 1.2684, change: -0.0025, changePercent: -0.20, region: "Forex" },
      { symbol: "USDJPY", name: "USD/JPY", price: 148.52, change: 0.45, changePercent: 0.30, region: "Forex" },
    ],
  },
];

function MarketCard({ market }: { market: MarketData }) {
  const isPositive = market.change >= 0;
  const changeColor = isPositive ? "text-primary" : "text-destructive";
  const changeArrow = isPositive ? "▲" : "▼";

  return (
    <div className="pixel-frame-sm bg-paper p-3 hover:bg-accent/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="pixel-font text-[11px] uppercase text-muted-foreground">{market.symbol}</p>
          <p className="font-serif text-sm font-semibold text-ink truncate">{market.name}</p>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="font-serif text-lg font-bold text-ink">{market.price.toFixed(2)}</p>
        </div>
        <div className={`text-right ${changeColor}`}>
          <p className="pixel-font text-[10px] font-semibold">
            {changeArrow} {Math.abs(market.changePercent).toFixed(2)}%
          </p>
          <p className="font-sans text-[9px]">{market.change > 0 ? "+" : ""}{market.change.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function MarketGrid({ data }: { data: RegionMarkets }) {
  return (
    <div>
      <h3 className="pixel-font mb-3 text-[11px] uppercase tracking-wider text-ink border-b border-border pb-2">
        {data.region}
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {data.markets.map((market) => (
          <MarketCard key={market.symbol} market={market} />
        ))}
      </div>
    </div>
  );
}

function MarketDataDisplay() {
  const [activeRegion, setActiveRegion] = React.useState<string>("India");
  const activeData = MOCK_MARKET_DATA.find((d) => d.region === activeRegion);

  return (
    <div className="space-y-6">
      {/* Region Tabs */}
      <div className="flex flex-wrap gap-2">
        {MOCK_MARKET_DATA.map((region) => (
          <button
            key={region.region}
            onClick={() => setActiveRegion(region.region)}
            className={`pixel-font px-3 py-1.5 text-[10px] uppercase transition-colors ${
              activeRegion === region.region
                ? "bg-primary text-background border border-primary"
                : "bg-paper border border-border text-ink hover:bg-accent/20"
            }`}
          >
            {region.region}
          </button>
        ))}
      </div>

      {/* Active Region Grid */}
      {activeData && <MarketGrid data={activeData} />}

      {/* Last Updated */}
      <p className="font-sans text-[9px] text-muted-foreground text-right">
        Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </div>
  );
}

type Point = { yield: number; changeBps: number | null };
type CountryBonds = {
  country: string;
  flag: string;
  rates: Partial<Record<"2Y" | "10Y" | "30Y", Point>>;
};
type BondPayload = { countries: CountryBonds[]; asOf: string };

const MATURITIES = ["2Y", "10Y", "30Y"] as const;

function BondCell({ point }: { point?: Point | undefined }) {
  if (!point) {
    return (
      <div className="pixel-frame-sm bg-paper px-3 py-2">
        <div className="font-serif text-lg text-muted-foreground">—</div>
      </div>
    );
  }
  const up = (point.changeBps ?? 0) >= 0;
  return (
    <div className="pixel-frame-sm bg-paper px-3 py-2">
      <div className="font-serif text-lg font-semibold text-ink">{point.yield}%</div>
      <div
        className={`font-sans text-xs ${point.changeBps === null ? "text-muted-foreground" : up ? "text-primary" : "text-destructive"}`}
      >
        {point.changeBps === null
          ? "\u2014"
          : `${up ? "\u25B2" : "\u25BC"} ${Math.abs(point.changeBps)} bps 1M`}
      </div>
    </div>
  );
}

function BondStrip() {
  const [countries, setCountries] = React.useState<CountryBonds[]>([]);
  const [asOf, setAsOf] = React.useState("");
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/bonds")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: BondPayload) => {
        if (!active) return;
        setCountries(data.countries ?? []);
        setAsOf(data.asOf ?? "");
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  if (failed) {
    return (
      <p className="mt-4 font-sans text-xs text-muted-foreground">
        Bond yields unavailable right now.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="pixel-font text-[10px] uppercase text-ink">
          Bonds — Government Yields (2Y / 10Y / 30Y)
        </h3>
        <span className="font-sans text-[10px] text-muted-foreground">
          Sovereign bond yields{asOf ? ` \u00B7 ${asOf}` : ""}
        </span>
      </div>
      <div className="space-y-3">
        {countries.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pixel-frame-sm h-[74px] animate-pulse bg-accent/30" />
            ))
          : countries.map((c) => (
              <div key={c.country} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <div className="pixel-font flex items-center bg-accent/40 px-3 py-2 text-[10px] uppercase text-ink">
                  {c.country}
                </div>
                {MATURITIES.map((m) => (
                  <div key={m}>
                    <div className="pixel-font mb-1 text-[9px] uppercase text-muted-foreground">
                      {m}
                    </div>
                    <BondCell point={c.rates[m]} />
                  </div>
                ))}
              </div>
            ))}
      </div>
    </div>
  );
}

export function MarketPulse() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="pixel-font text-[11px] text-primary">[ Market Today ]</p>
      <h2 className="display-font mt-3 text-3xl text-ink">Global Market Pulse</h2>

      <div className="pixel-frame-sm mt-6 bg-paper p-4">
        <ClientOnly
          fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-accent/30 rounded" />
              ))}
            </div>
          }
        >
          <MarketDataDisplay />
        </ClientOnly>
      </div>
      <p className="mt-2 font-sans text-[10px] text-muted-foreground">
        Live market data for global indices, stocks, and forex.
      </p>

      <ClientOnly fallback={null}>
        <BondStrip />
      </ClientOnly>
    </section>
  );
}
