// Provider abstraction: each entry is a normalizable headline feed.
// Add new sources here (RSS today; an API-backed provider can be added the
// same way as long as it returns RawHeadline[]).

export type NewsSource = {
  /** Display name shown in the UI. */
  name: string;
  /** 0-15 quality bonus added to every story from this source. */
  quality: number;
  url: string;
  /** Optional hint used when the story has no other category signal. */
  defaultCategory?: string;
};

export const RSS_SOURCES: NewsSource[] = [
  // Global wires / institutions
  { name: "Reuters", quality: 15, url: "https://news.google.com/rss/search?q=when:1d+allinurl:reuters.com/markets&hl=en-US&gl=US&ceid=US:en" },
  { name: "CNBC", quality: 12, url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", defaultCategory: "Markets" },
  { name: "CNBC", quality: 12, url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258" },
  { name: "CNBC Economy", quality: 12, url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", defaultCategory: "Macro" },
  { name: "Yahoo Finance", quality: 7, url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Federal Reserve", quality: 15, url: "https://www.federalreserve.gov/feeds/press_all.xml", defaultCategory: "RBI / Central Banks" },
  { name: "RBI", quality: 15, url: "https://www.rbi.org.in/pressreleases_rss.xml", defaultCategory: "RBI / Central Banks" },
  { name: "SEBI", quality: 14, url: "https://www.sebi.gov.in/sebirss.xml", defaultCategory: "India" },

  // India
  { name: "Economic Times", quality: 11, url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", defaultCategory: "Markets" },
  { name: "Economic Times", quality: 11, url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms", defaultCategory: "Macro" },
  { name: "Mint", quality: 11, url: "https://www.livemint.com/rss/markets", defaultCategory: "Markets" },
  { name: "Mint", quality: 11, url: "https://www.livemint.com/rss/money", defaultCategory: "Markets" },
  { name: "Business Standard", quality: 10, url: "https://www.business-standard.com/rss/markets-106.rss", defaultCategory: "Markets" },
  { name: "Business Standard", quality: 10, url: "https://www.business-standard.com/rss/finance-103.rss", defaultCategory: "Banking" },
  { name: "Moneycontrol", quality: 9, url: "https://www.moneycontrol.com/rss/economy.xml", defaultCategory: "Macro" },
  { name: "Moneycontrol", quality: 9, url: "https://www.moneycontrol.com/rss/business.xml", defaultCategory: "Companies" },
];

/** De-dupe preference: higher wins when the same story shows up twice. */
export function sourceQuality(name: string): number {
  const found = RSS_SOURCES.find((s) => s.name.toLowerCase() === name.toLowerCase());
  return found?.quality ?? 5;
}
