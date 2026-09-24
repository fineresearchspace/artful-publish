import { useEffect, useState } from "react";
import { getTreasuryYields, type TreasuryYield } from "@/lib/treasury-yields";

export function TreasuryYields() {
  const [yields, setYields] = useState<TreasuryYield[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTreasuryYields();
        setYields(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching treasury yields:", err);
        setError("Unable to load yield data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && yields.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pixel-font text-[11px] text-primary">[ US TREASURY YIELDS ]</p>
        <h2 className="display-font mt-3 text-3xl text-ink">Bond Market Yields</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pixel-frame-sm bg-paper p-4 h-24 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 border-t border-border">
      <div className="flex flex-col gap-6">
        <div>
          <p className="pixel-font text-[11px] text-primary uppercase">[ US Treasury Yields ]</p>
          <h2 className="display-font mt-3 text-3xl text-ink">Bond Market Yields</h2>
          <p className="mt-2 font-serif text-sm text-muted-foreground italic">
            Real-time data via Yahoo Finance • Updated every 5 minutes
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {yields.map((y) => (
              <div
                key={y.symbol}
                className="pixel-frame-sm bg-paper p-4 border border-border hover:border-primary transition-colors"
              >
                <span className="pixel-font text-[10px] text-muted-foreground block mb-2 uppercase">
                  {y.name}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink">{y.yield.toFixed(2)}%</span>
                  <span
                    className={`text-[10px] font-mono ${
                      y.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {y.change >= 0 ? "+" : ""}
                    {y.change.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
