import { useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";

type NewsItem = {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
};

type FxPair = { pair: string; rate: number; changePct: number | null };

type Tick =
  | { kind: "quote"; label: string; value: string; changePct: number | null }
  | { kind: "headline"; label: string; value: string; href: string };

function TickItem({ tick }: { tick: Tick }) {
  const body =
    tick.kind === "quote" ? (
      <span className="inline-flex items-baseline gap-2">
        <span className="pixel-font text-[10px] text-muted-foreground">{tick.label}</span>
        <span className="font-sans text-[12px] font-semibold text-ink">{tick.value}</span>
        {tick.changePct !== null ? (
          <span
            className={`font-sans text-[11px] ${tick.changePct >= 0 ? "text-primary" : "text-destructive"}`}
          >
            {tick.changePct >= 0 ? "▲" : "▼"} {Math.abs(tick.changePct).toFixed(2)}%
          </span>
        ) : null}
      </span>
    ) : (
      <span className="inline-flex items-baseline gap-2">
        <span className="pixel-font text-[10px] text-primary">{tick.label}</span>
        <span className="font-sans text-[12px] text-ink">{tick.value}</span>
      </span>
    );

  return (
    <span className="inline-flex items-center">
      {tick.kind === "headline" ? (
        <a
          href={tick.href}
          target="_blank"
          rel="noreferrer"
          className="transition-opacity hover:opacity-70"
        >
          {body}
        </a>
      ) : (
        body
      )}
      <span aria-hidden="true" className="mx-5 text-border">
        ◆
      </span>
    </span>
  );
}

function Ticker() {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    let active = true;

    const loadFx = fetch("/api/fx")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pairs?: FxPair[] } | null): Tick[] =>
        (d?.pairs ?? []).map((p) => ({
          kind: "quote" as const,
          label: p.pair,
          value: p.rate.toFixed(p.rate > 20 ? 2 : 4),
          changePct: p.changePct,
        })),
      )
      .catch((): Tick[] => []);

    const loadNews = fetch("/api/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: NewsItem[] } | null): Tick[] =>
        (d?.items ?? []).slice(0, 12).map((n) => ({
          kind: "headline" as const,
          label: n.source,
          value: n.title,
          href: n.sourceUrl,
        })),
      )
      .catch((): Tick[] => []);

    Promise.all([loadFx, loadNews]).then(([fx, news]) => {
      if (!active) return;
      setTicks([...fx, ...news]);
    });

    return () => {
      active = false;
    };
  }, []);

  if (ticks.length === 0) return null;

  const duration = Math.max(45, ticks.length * 7);

  return (
    <div className="ticker-mask overflow-hidden py-2">
      <div
        className="ticker-track"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <span key={copy} aria-hidden={copy === 1} className="inline-flex items-center pr-5">
            {ticks.map((t, i) => (
              <TickItem key={`${copy}-${i}`} tick={t} />
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HeadlineTicker() {
  return (
    <div className="border-b border-border bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6">
        <span className="pixel-font hidden shrink-0 items-center gap-2 text-[10px] text-muted-foreground sm:inline-flex">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          Live
        </span>
        <div className="min-w-0 flex-1">
          <ClientOnly fallback={<div className="h-9" />}>
            <Ticker />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
