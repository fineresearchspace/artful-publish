import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";


// TradingView's free, no-API-key "Market Overview" embed. Client-side only:
// the script injects an iframe, so it must never run during SSR.
const WIDGET_CONFIG = {
  colorTheme: "light",
  dateRange: "1D",
  showChart: true,
  locale: "en",
  largeChartUrl: "",
  isTransparent: true,
  showSymbolLogo: true,
  showFloatingTooltip: true,
  width: "100%",
  height: 500,
  plotLineColorGrowing: "rgba(41, 98, 255, 1)",
  plotLineColorFalling: "rgba(41, 98, 255, 1)",
  gridLineColor: "rgba(42, 46, 57, 0.06)",
  scaleFontColor: "rgba(19, 23, 34, 1)",
  belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
  belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
  belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
  belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
  symbolActiveColor: "rgba(41, 98, 255, 0.12)",
  tabs: [
    {
      title: "Indices",
      symbols: [
        { s: "BSE:SENSEX", d: "Sensex" },
        { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
        { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
        { s: "FOREXCOM:DJI", d: "Dow 30" },
        { s: "INDEX:NKY", d: "Nikkei 225" },
        { s: "INDEX:DEU40", d: "DAX" },
        { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
        { s: "NSE:NIFTY", d: "Nifty 50" },
      ],
      originalTitle: "Indices",
    },
    {
      title: "Forex",

      symbols: [
        { s: "FX_IDC:USDINR", d: "USD/INR" },
        { s: "FX:EURUSD", d: "EUR/USD" },
        { s: "FX:GBPUSD", d: "GBP/USD" },
        { s: "FX:USDJPY", d: "USD/JPY" },
      ],
      originalTitle: "Forex",
    },
  ],
};

function TradingViewMarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}

type BondRate = {
  label: string;
  yield: number;
  previous: number | null;
  changeBps: number | null;
};
type BondPayload = { rates: BondRate[]; asOf: string };

function BondStrip() {
  const [rates, setRates] = useState<BondRate[]>([]);
  const [asOf, setAsOf] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/bonds")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: BondPayload) => {
        if (!active) return;
        setRates(data.rates ?? []);
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
        <h3 className="pixel-font text-[10px] uppercase text-ink">Bonds — US Treasury Yields</h3>
        <span className="font-sans text-[10px] text-muted-foreground">
          US Treasury par curve{asOf ? ` \u00B7 ${asOf}` : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rates.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="pixel-frame-sm h-[74px] animate-pulse bg-accent/30" />
            ))
          : rates.map((r) => {
              const up = (r.changeBps ?? 0) >= 0;
              return (
                <div key={r.label} className="pixel-frame-sm bg-paper px-3 py-2">
                  <div className="pixel-font text-[9px] uppercase text-muted-foreground">
                    {r.label}
                  </div>
                  <div className="font-serif text-lg font-semibold text-ink">{r.yield}%</div>
                  <div
                    className={`font-sans text-xs ${r.changeBps === null ? "text-muted-foreground" : up ? "text-primary" : "text-destructive"}`}
                  >
                    {r.changeBps === null
                      ? "\u2014"
                      : `${up ? "\u25B2" : "\u25BC"} ${Math.abs(r.changeBps)} bps`}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export function MarketPulse() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="pixel-font text-[11px] text-primary">[ Market Today ]</p>
      <h2 className="pixel-font mt-3 text-sm text-ink">Global Market Pulse</h2>

      <div className="pixel-frame-sm mt-6 bg-paper p-3">
        <ClientOnly
          fallback={
            <div className="h-[500px] animate-pulse bg-accent/30" aria-hidden="true" />
          }
        >
          <TradingViewMarketOverview />
        </ClientOnly>
      </div>
      <p className="mt-2 font-sans text-[10px] text-muted-foreground">
        Live quotes by TradingView.
      </p>

      <ClientOnly fallback={null}>
        <BondStrip />
      </ClientOnly>
    </section>
  );

}
