import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { explainMarketMove } from "@/lib/market-reasons.functions";

export function MarketReasons({
  name,
  region,
  changePercent,
}: {
  name: string;
  region: string;
  changePercent: number | null;
}) {
  const explain = useServerFn(explainMarketMove);
  const { data, isLoading, error } = useQuery({
    queryKey: ["market-reasons", name, changePercent?.toFixed(2)],
    queryFn: () => explain({ data: { name, region, changePercent } }),
    staleTime: 20 * 60 * 1000,
    retry: false,
  });
  const up = (changePercent ?? 0) >= 0;

  return (
    <div className="mt-8 rounded-md border border-border bg-card p-5">
      <p className="font-editorial-ui text-[11px] font-semibold uppercase text-primary">
        Why {name} is {up ? "up" : "down"} {changePercent !== null ? `${changePercent.toFixed(2)}%` : ""}
      </p>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ) : error ? (
        <p className="mt-3 font-serif text-sm text-muted-foreground">
          {(error as Error).message || "Explanation unavailable right now."}
        </p>
      ) : data ? (
        <>
          <p className="mt-3 font-serif text-base text-foreground">{data.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 font-serif text-sm text-foreground">
            {data.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {data.sources.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="font-editorial-ui text-[10px] font-semibold uppercase text-muted-foreground">Related headlines</p>
              <ul className="mt-2 space-y-1">
                {data.sources.map((s) => (
                  <li key={s.url} className="text-sm">
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {s.title}
                    </a>{" "}
                    <span className="text-xs text-muted-foreground">· {s.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">AI-generated from recent headlines; not investment advice.</p>
        </>
      ) : null}
    </div>
  );
}
