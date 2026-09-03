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
    </section>
  );
}
