import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import MarketPulseNews from "@/components/MarketPulseNews";


export const Route = createFileRoute("/Market-Pulse")({
  head: () => ({
    meta: [
      { title: "Market Pulse — Weekly Wonders" },
      {
        name: "description",
        content: "Live global market data: indices, commodities, and currencies.",
      },
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

function MarketPulsePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("india");
  const [markets, setMarkets] = useState<MarketData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMarkets(null);
    setLoadError(null);

    fetch(`${API_BASE_URL}/api/markets/region/${activeTab}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => setMarkets(data.data))
      .catch((err) => {
        console.error("Market Pulse fetch error:", err);
        setLoadError("Could not load market data. Is the backend running?");
      });
  }, [activeTab]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pixel-font text-[11px] text-primary">[ Market Pulse ]</p>
        <h1 className="display-font mt-3 text-4xl text-ink sm:text-5xl">Market Pulse</h1>
        <p className="mt-3 font-serif text-lg text-muted-foreground">
          Indices, commodities, and currencies from around the world.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pixel-font border border-border px-3 py-1.5 text-[10px] transition-colors ${
                activeTab === tab.key
                  ? "bg-ink text-background"
                  : "bg-paper hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="mt-10 font-serif text-sm text-muted-foreground">{loadError}</p>
        ) : !markets ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pixel-frame-sm animate-pulse bg-paper p-5">
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
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="pixel-frame-sm bg-paper p-5">
        <p className="mt-1 font-serif text-lg">{data.name}</p>
        <p className="mt-3 font-serif text-sm text-muted-foreground">
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
      className="pixel-frame-sm pixel-lift block bg-paper p-5 transition-opacity hover:opacity-90"
    >
      <p className="mt-1 font-serif text-lg">{data.name}</p>
      <p className="display-font mt-3 text-3xl text-ink">
        {data.latest_price?.toLocaleString()}
      </p>
      <p
        className={`pixel-font mt-2 text-[11px] ${
          isUp ? "text-green-700" : "text-red-700"
        }`}
      >
        {isUp ? "▲" : "▼"} {data.change?.toFixed(2)} ({data.change_percent?.toFixed(2)}%)
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">{data.market_status}</p>
    </a>
  );
}