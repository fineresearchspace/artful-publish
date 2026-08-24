import { useEffect, useState } from "react";

const API_BASE_URL = "https://weekly-wonders-market.onrender.com";

const PULSE_SYMBOLS = ["^NSEI", "^GSPC", "^NDX", "^N225", "^STOXX50E", "^HSI"];

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

export function MarketPulse() {
  const [markets, setMarkets] = useState<MarketData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/markets`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const pulse = data.data.filter((m: MarketData) =>
          PULSE_SYMBOLS.includes(m.symbol),
        );
        setMarkets(pulse);
      })
      .catch((err) => {
        console.error("Market Pulse fetch error:", err);
        setLoadError("Could not load market data. Is the backend running?");
      });
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="pixel-font text-[11px] text-primary">[ Market Today ]</p>
      <h2 className="pixel-font mt-3 text-sm text-ink">Global Market Pulse</h2>

      {loadError ? (
        <p className="mt-6 font-serif text-sm text-muted-foreground">{loadError}</p>
      ) : !markets ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PULSE_SYMBOLS.map((s) => (
            <div key={s} className="pixel-frame-sm animate-pulse bg-paper p-5">
              <div className="h-3 w-24 bg-accent" />
              <div className="mt-4 h-6 w-32 bg-accent" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <MarketCard key={m.symbol} data={m} />
          ))}
        </div>
      )}
    </section>
  );
}

function MarketCard({ data }: { data: MarketData }) {
  // Yahoo Finance URLs use the exact same symbol format we already fetch with -
  // no separate mapping needed, unlike TradingView.
  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(data.symbol)}/`;

  if (!data.available) {
    return (
      <div className="pixel-frame-sm bg-paper p-5">
        <p className="pixel-font text-[10px] text-muted-foreground">{data.region}</p>
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
      <p className="pixel-font text-[10px] text-muted-foreground">{data.region}</p>
      <p className="mt-1 font-serif text-lg">{data.name}</p>
      <p className="pixel-font mt-3 text-lg text-ink">
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