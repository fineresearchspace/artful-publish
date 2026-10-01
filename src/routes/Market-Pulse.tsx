import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import MarketPulseNews from "@/components/MarketPulseNews";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/Market-Pulse")({
  head: () => ({
    meta: [
      { title: "Market Pulse — The Context" },
      {
        name: "description",
        content: "A delayed-data performance heatmap for global indices, commodities and currencies, alongside financial news.",
      },
      { property: "og:title", content: "Market Pulse — The Context" },
      { property: "og:description", content: "Compare global indices, commodities and currencies in a delayed-data market heatmap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketPulsePage,
});

const API_BASE_URL = "https://weekly-wonders-market.onrender.com";

const TABS = [
  { key: "india", label: "India" },
  { key: "us", label: "US" },
  { key: "europe", label: "Europe" },
  { key: "asia", label: "Asia" },
  { key: "commodities", label: "Commodities" },
  { key: "currencies", label: "Currencies" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type MarketData = {
  name: string;
  symbol: string;
  region: string;
  latest_price: number | null;
  change: number | null;
  change_percent: number | null;
  market_status: string;
  available: boolean;
  error: string | null;
};

function heatClass(change: number | null, available: boolean) {
  if (!available || change === null || Math.abs(change) < 0.05) {
    return "bg-muted text-foreground";
  }
  if (change >= 1) return "bg-chart-2 text-primary-foreground";
  if (change > 0) return "bg-chart-2/70 text-foreground";
  if (change <= -1) return "bg-destructive text-destructive-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

function MarketPulsePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("india");
  const [markets, setMarkets] = useState<MarketData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setMarkets(null);
    setLoadError(null);

    fetch(`${API_BASE_URL}/api/markets/region/${activeTab}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => setMarkets(data.data))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Market Pulse fetch error:", err);
        setLoadError("Could not load market data. Is the backend running?");
      });

    return () => controller.abort();
  }, [activeTab]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pixel-font text-[11px] text-primary">[ Market Pulse ]</p>
        <h1 className="display-font mt-3 text-4xl text-ink sm:text-5xl">Market Pulse</h1>
        <p className="mt-3 font-serif text-lg text-muted-foreground">
          Compare global indices, commodities, and currencies at a glance. Delayed data.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Market groups">
          {TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className="font-editorial-ui text-xs font-semibold uppercase"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {loadError ? (
          <p className="mt-10 font-serif text-sm text-muted-foreground">{loadError}</p>
        ) : !markets ? (
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-muted p-4">
                <div className="h-3 w-24 bg-accent" />
                <div className="mt-4 h-6 w-32 bg-accent" />
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <p className="mt-10 font-serif text-sm text-muted-foreground">
            No assets configured for this region yet.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {markets.map((m) => (
              <MarketCard key={m.symbol} data={m} />
            ))}
          </div>
        )}
      </section>
      <div className="py-14">
        <MarketPulseNews />
      </div>
    </SiteShell>
  );
}


function MarketCard({ data }: { data: MarketData }) {
  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(data.symbol)}/`;

  if (!data.available) {
    return (
      <div className="flex min-h-32 flex-col justify-between rounded-md border border-border bg-muted p-4">
        <p className="font-editorial-ui text-sm font-semibold">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          Data temporarily unavailable
        </p>
      </div>
    );
  }

  const isUp = (data.change ?? 0) >= 0;

  return (
    <a
      href={yahooUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex min-h-32 flex-col justify-between rounded-md border border-border p-4 transition-transform hover:scale-[1.02] ${heatClass(data.change_percent, data.available)}`}
    >
      <p className="font-editorial-ui text-sm font-semibold leading-tight">{data.name}</p>
      <div>
        <p className="font-editorial-ui text-xl font-semibold tabular-nums">
          {data.latest_price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-xs font-semibold tabular-nums">
          {isUp ? "▲" : "▼"} {data.change?.toFixed(2)} ({data.change_percent?.toFixed(2)}%)
        </p>
        <p className="mt-1 text-[10px] opacity-75">{data.market_status || "Delayed"}</p>
      </div>
    </a>
  );
}