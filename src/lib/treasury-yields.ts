/**
 * Fetch US Treasury yields from Yahoo Finance
 * Symbols: ^TNX (10-Year), ^TYX (30-Year), ^IRX (13-Week Bill)
 */

export interface TreasuryYield {
  name: string;
  symbol: string;
  yield: number;
  change: number;
}

async function fetchYahooFinanceData(symbol: string): Promise<{ yield: number; change: number } | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );

    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data.quoteSummary?.result?.[0]?.price;

    if (!price) {
      console.error(`No price data for ${symbol}`);
      return null;
    }

    return {
      yield: price.regularMarketPrice?.raw ?? 0,
      change: price.regularMarketChange?.raw ?? 0,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function getTreasuryYields(): Promise<TreasuryYield[]> {
  const symbols = [
    { name: "10-Year", symbol: "^TNX" },
    { name: "30-Year", symbol: "^TYX" },
    { name: "2-Year", symbol: "^TWSY" },
    { name: "3-Month", symbol: "^IRX" },
  ];

  const results = await Promise.all(
    symbols.map(async (item) => {
      const data = await fetchYahooFinanceData(item.symbol);
      return {
        name: item.name,
        symbol: item.symbol,
        yield: data?.yield ?? 0,
        change: data?.change ?? 0,
      };
    }),
  );

  return results.filter((r) => r.yield > 0);
}
