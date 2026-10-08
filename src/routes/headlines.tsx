import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import MarketPulseNews from "@/components/MarketPulseNews";

export const Route = createFileRoute("/headlines")({
  head: () => ({ meta: [
    { title: "Today's Headlines — The Context" },
    { name: "description", content: "The latest financial headlines across markets, business, policy and currencies, in chronological order." },
    { property: "og:title", content: "Today's Headlines — The Context" },
    { property: "og:description", content: "Follow the latest market and business news with The Context's full headlines timeline." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HeadlinesPage,
});

function HeadlinesPage() {
  return <SiteShell><div className="py-14"><MarketPulseNews /></div></SiteShell>;
}