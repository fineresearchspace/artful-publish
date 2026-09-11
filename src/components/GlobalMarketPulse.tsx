import { ClientOnly } from "@tanstack/react-router";

/**
 * TradingView "Market Overview" embed.
 *
 * Uses TradingView's documented iframe embed instead of the injected
 * <script> loader. The script loader frequently renders blank in React
 * (StrictMode double-mount, cleanup wiping the injected iframe, and the
 * script never re-executing after a client-side navigation). The iframe URL
 * carries the whole config in its hash, so it always renders.
 *
 * https://www.tradingview.com/widget-docs/tutorials/iframe/build-page/
 */
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
  height: "100%",
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
      title: "India",
      originalTitle: "India",
      symbols: [
        { s: "SENSEX", d: "Sensex" },
        { s: "NIFTY50", d: "NIFTY 50" },
        { s: "NIFTYJR", d: "NIFTY Next 50" },
        { s: "NIFTYIT", d: "NIFTY IT" },
        { s: "NIFTYBANK", d: "NIFTY Bank" },
        { s: "NIFTYPHARMA", d: "NIFTY Pharma" },
        { s: "NIFTYAUTO", d: "NIFTY Auto" },
        { s: "NIFTYREALTY", d: "NIFTY Realty" },
      ],
    },
    {
      title: "US",
      originalTitle: "US",
      symbols: [
        { s: "FORCEPOINT:GSPC", d: "S&P 500" },
        { s: "FORCEPOINT:CCMP", d: "Nasdaq 100" },
        { s: "FORCEPOINT:INDU", d: "Dow Jones" },
        { s: "FORCEPOINT:RUT", d: "Russell 2000" },
        { s: "FORCEPOINT:VIX", d: "VIX" },
      ],
    },
    {
      title: "Japan",
      originalTitle: "Japan",
      symbols: [
        { s: "TVC:N225", d: "Nikkei 225" },
        { s: "TVC:JPXN", d: "Topix" },
        { s: "FX:USDJPY", d: "USD/JPY" },
      ],
    },
    {
      title: "Europe",
      originalTitle: "Europe",
      symbols: [
        { s: "TVC:DAX", d: "DAX" },
        { s: "TVC:FTSE", d: "FTSE 100" },
        { s: "TVC:FCHI", d: "CAC 40" },
        { s: "TVC:STOXX50E", d: "Euro Stoxx 50" },
      ],
    },
    {
      title: "Forex",
      originalTitle: "Forex",
      symbols: [
        { s: "FX:USDINR", d: "USD/INR" },
        { s: "FX:EURUSD", d: "EUR/USD" },
        { s: "FX:GBPUSD", d: "GBP/USD" },
        { s: "FX:USDJPY", d: "USD/JPY" },
      ],
    },
  ],
};

function buildEmbedSrc() {
  const payload = {
    ...WIDGET_CONFIG,
    utm_source: typeof window !== "undefined" ? window.location.hostname : "",
    utm_medium: "widget",
    utm_campaign: "market-overview",
  };
  return `https://s.tradingview.com/embed-widget/market-overview/?locale=en#${encodeURIComponent(
    JSON.stringify(payload),
  )}`;
}

function TradingViewMarketOverview() {
  return (
    <iframe
      title="Market overview by TradingView"
      src={buildEmbedSrc()}
      loading="lazy"
      scrolling="no"
      className="block h-[500px] w-full border-0"
    />
  );
}

export function MarketPulse() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        [ Market Today ]
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-foreground">Global Market Pulse</h2>

      <div className="mt-6 rounded-lg border border-border bg-card p-3">
        <ClientOnly
          fallback={<div className="h-[500px] animate-pulse rounded bg-accent" aria-hidden="true" />}
        >
          <TradingViewMarketOverview />
        </ClientOnly>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Live quotes by TradingView.</p>
    </section>
  );
}
