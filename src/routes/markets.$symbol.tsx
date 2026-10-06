import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { MarketHistoryChart } from "@/components/site/MarketHistoryChart";
import { explainMarketMove } from "@/lib/market-reasons.functions";

const searchSchema = z.object({
  name: z.string().optional(),
  region: z.string().optional(),
  price: z.number().optional(),
  change: z.number().optional(),
  pct: z.number().optional(),
});

export const Route = createFileRoute("/markets/$symbol")({
  validateSearch: (s) => searchSchema.parse(s),
  head: ({ params }) => {
    const label = decodeURIComponent(params.symbol);
    return {
      meta: [
        { title: `${label} today: why it moved, history & news — The Context` },
        { name: "description", content: `Why ${label} is up or down today, its price history and related market news.` },
        { property: "og:title", content: `${label} today — The Context` },
        { property: "og:description", content: `Reasons behind today's ${label} move, price history and news.` },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: MarketLandingPage,
});

function MarketLandingPage() {
  const { symbol } = Route.useParams();
  const search = Route.useSearch();
  const name = search.name ?? symbol;
  const pct = search.pct ?? null;
  const up = (pct ?? 0) >= 0;
  const explain = useServerFn(explainMarketMove);
  const { data, isLoading, error } = useQuery({
    queryKey: ["market-reasons", name, pct?.toFixed(2)],
    queryFn: () => explain({ data: { name, region: search.region ?? "", changePercent: pct } }),
    staleTime: 20 * 60 * 1000,
    retry: false,
  });

  return (
    <SiteShell>
      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link to="/Market-Pulse" className="font-editorial-ui text-[11px] font-semibold uppercase text-primary hover:underline">
          ← Market Pulse
        </Link>
        <p className="mt-6 font-editorial-ui text-[11px] font-semibold uppercase text-muted-foreground">
          {search.region ?? "Market"} · Delayed data
        </p>
        <h1 className="display-font mt-2 text-4xl text-ink sm:text-5xl">
          Why is {name} {pct === null ? "moving" : up ? "up" : "down"} today?
        </h1>
        {search.price !== undefined && (
          <p className="mt-4 font-editorial-ui text-2xl font-semibold tabular-nums">
            {search.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            <span className={`text-base ${up ? "text-primary" : "text-destructive"}`}>
              {up ? "▲" : "▼"} {search.change?.toFixed(2)} ({pct?.toFixed(2)}%)
            </span>
          </p>
        )}

        <section className="mt-8 rounded-md border border-border bg-card p-6">
          <h2 className="display-font text-2xl text-ink">Today's drivers</h2>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-muted" />)}
            </div>
          ) : error ? (
            <p className="mt-3 font-serif text-muted-foreground">{(error as Error).message}</p>
          ) : data ? (
            <>
              <p className="mt-3 font-serif text-lg text-foreground">{data.summary}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 font-serif text-foreground">
                {data.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p className="mt-4 text-[10px] text-muted-foreground">AI-generated from recent headlines; not investment advice.</p>
            </>
          ) : null}
        </section>

        <section className="mt-10">
          <h2 className="display-font text-2xl text-ink">History of {name}</h2>
          {data?.background && <p className="mt-3 font-serif text-foreground">{data.background}</p>}
          <MarketHistoryChart symbol={symbol} name={name} />
        </section>

        <section className="mt-12">
          <h2 className="display-font text-2xl text-ink">Articles on {name}</h2>
          {isLoading ? (
            <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
          ) : data && data.related.length > 0 ? (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {data.related.map((a) => (
                <li key={a.url} className="flex gap-4 py-4">
                  {a.imageUrl && (
                    <img src={a.imageUrl} alt="" loading="lazy" className="hidden h-20 w-28 shrink-0 rounded object-cover sm:block" onError={(e) => (e.currentTarget.style.display = "none")} />
                  )}
                  <div className="min-w-0">
                    <a href={a.url} target="_blank" rel="noreferrer" className="font-serif text-lg text-ink hover:text-primary">
                      {a.title}
                    </a>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>
                    <p className="mt-1 font-editorial-ui text-[10px] font-semibold uppercase text-muted-foreground">
                      {a.source} · {new Date(a.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-serif text-muted-foreground">No recent articles mention {name}.</p>
          )}
        </section>
      </article>
    </SiteShell>
  );
}
