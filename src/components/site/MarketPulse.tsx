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
  showTabs: true,
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
      title: "India",
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
      originalTitle: "India",
    },
    {
      title: "US",
      symbols: [
        { s: "FORCEPOINT:GSPC", d: "S&P 500" },
        { s: "FORCEPOINT:CCMP", d: "Nasdaq 100" },
        { s: "FORCEPOINT:INDU", d: "Dow Jones" },
        { s: "FORCEPOINT:RUT", d: "Russell 2000" },
        { s: "FORCEPOINT:VIX", d: "VIX" },
      ],
      originalTitle: "US",
    },
    {
      title: "Japan",
      symbols: [
        { s: "TVC:N225", d: "Nikkei 225" },
        { s: "TVC:JPXN", d: "Topix" },
        { s: "FX:USDJPY", d: "USD/JPY" },
      ],
      originalTitle: "Japan",
    },
    {
      title: "Europe",
      symbols: [
        { s: "TVC:DAX", d: "DAX" },
        { s: "TVC:FTSE", d: "FTSE 100" },
        { s: "TVC:FCHI", d: "CAC 40" },
        { s: "TVC:STOXX50E", d: "Euro Stoxx 50" },
      ],
      originalTitle: "Europe",
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
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent double-loading in React StrictMode
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Clear previous content
    container.innerHTML = "";

    // Create widget div
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    // Create script tag
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify(WIDGET_CONFIG);

    // Append script to container
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: "500px", width: "100%" }}
    />
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
  const [countries, setCountries] = useState<CountryBonds[]>([]);
  const [asOf, setAsOf] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
