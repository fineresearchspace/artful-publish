import React from "react";
import { ClientOnly } from "@tanstack/react-router";

/**
 * TradingView Market Overview using iframe embed.
 * This uses TradingView's documented iframe approach instead of script injection,
 * which is more reliable in React environments.
 */

function TradingViewMarketOverview() {
  return (
    <div className="tradingview-widget-container">
      <div className="tradingview-widget-container__widget">
        <iframe
          src="https://www.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22showChart%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A500%2C%22colorTheme%22%3A%22light%22%2C%22dateRange%22%3A%221D%22%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Atrue%2C%22isTransparent%22%3Atrue%2C%22plotLineColorGrowing%22%3A%22rgba%2841%2C%2098%2C%20255%2C%201%29%22%2C%22plotLineColorFalling%22%3A%22rgba%2841%2C%2098%2C%20255%2C%201%29%22%2C%22gridLineColor%22%3A%22rgba%2842%2C%2046%2C%2057%2C%200.06%29%22%2C%22scaleFontColor%22%3A%22rgba%2819%2C%2023%2C%2034%2C%201%29%22%2C%22belowLineFillColorGrowing%22%3A%22rgba%2841%2C%2098%2C%20255%2C%200.12%29%22%2C%22belowLineFillColorFalling%22%3A%22rgba%2841%2C%2098%2C%20255%2C%200.12%29%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba%2841%2C%2098%2C%20255%2C%200%29%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba%2841%2C%2098%2C%20255%2C%200%29%22%2C%22symbolActiveColor%22%3A%22rgba%2841%2C%2098%2C%20255%2C%200.12%29%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22India%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22SENSEX%22%2C%22d%22%3A%22Sensex%22%7D%2C%7B%22s%22%3A%22NIFTY50%22%2C%22d%22%3A%22NIFTY%2050%22%7D%2C%7B%22s%22%3A%22NIFTYJR%22%2C%22d%22%3A%22NIFTY%20Next%2050%22%7D%2C%7B%22s%22%3A%22NIFTYIT%22%2C%22d%22%3A%22NIFTY%20IT%22%7D%2C%7B%22s%22%3A%22NIFTYBANK%22%2C%22d%22%3A%22NIFTY%20Bank%22%7D%2C%7B%22s%22%3A%22NIFTYPHARMA%22%2C%22d%22%3A%22NIFTY%20Pharma%22%7D%2C%7B%22s%22%3A%22NIFTYAUTO%22%2C%22d%22%3A%22NIFTY%20Auto%22%7D%2C%7B%22s%22%3A%22NIFTYREALTY%22%2C%22d%22%3A%22NIFTY%20Realty%22%7D%5D%2C%22originalTitle%22%3A%22India%22%7D%2C%7B%22title%22%3A%22US%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22SPX%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22NDX%22%2C%22d%22%3A%22Nasdaq%20100%22%7D%2C%7B%22s%22%3A%22DJI%22%2C%22d%22%3A%22Dow%2030%22%7D%2C%7B%22s%22%3A%22RUT%22%2C%22d%22%3A%22Russell%202000%22%7D%2C%7B%22s%22%3A%22VIX%22%2C%22d%22%3A%22VIX%22%7D%5D%2C%22originalTitle%22%3A%22US%22%7D%2C%7B%22title%22%3A%22Japan%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22TVC%3AN225%22%2C%22d%22%3A%22Nikkei%20225%22%7D%2C%7B%22s%22%3A%22TVC%3AJPXN%22%2C%22d%22%3A%22Topix%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%2C%22d%22%3A%22USD%2FJPY%22%7D%5D%2C%22originalTitle%22%3A%22Japan%22%7D%2C%7B%22title%22%3A%22Europe%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22TVC%3ADAX%22%2C%22d%22%3A%22DAX%22%7D%2C%7B%22s%22%3A%22TVC%3AFTSE%22%2C%22d%22%3A%22FTSE%20100%22%7D%2C%7B%22s%22%3A%22TVC%3AFCHI%22%2C%22d%22%3A%22CAC%2040%22%7D%2C%7B%22s%22%3A%22TVC%3ASTOXX50E%22%2C%22d%22%3A%22Euro%20Stoxx%2050%22%7D%5D%2C%22originalTitle%22%3A%22Europe%22%7D%2C%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX_IDC%3AUSDINR%22%2C%22d%22%3A%22USD%2FINR%22%7D%2C%7B%22s%22%3A%22FX%3AEURUSD%22%2C%22d%22%3A%22EUR%2FUSD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%2C%22d%22%3A%22GBP%2FUSD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%2C%22d%22%3A%22USD%2FJPY%22%7D%5D%2C%22originalTitle%22%3A%22Forex%22%7D%5D%7D"
          style={{ width: "100%", height: "500px" }}
          frameBorder="0"
          allowTransparency={true}
          scrolling="no"
          allowFullScreen
        />
      </div>
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
