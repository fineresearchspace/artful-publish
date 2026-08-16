import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PixelArt } from "@/components/PixelArt";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Weekly Wonders" },
      {
        name: "description",
        content:
          "Weekly Wonders is a personal publication about markets, finance, business, investing and mental models worth understanding.",
      },
      { property: "og:title", content: "About — Weekly Wonders" },
      {
        property: "og:description",
        content: "A personal publication about markets, money and ideas worth understanding.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <PixelArt variant="thinking" className="size-16 border-2 border-ink" />
        <h1 className="pixel-font mt-8 text-2xl text-ink">About</h1>
        <div className="pixel-rule mt-6 w-32" />

        <div className="article-prose mt-8">
          <p>
            <strong>Weekly Wonders</strong> is a personal publication. One issue a week, written
            because writing is how I work out what I actually think.
          </p>
          <p>It wanders around a few recurring subjects:</p>
          <ul>
            <li>markets, and why they behave the way they do</li>
            <li>finance and the plumbing underneath it</li>
            <li>business, and how companies really make money</li>
            <li>investing, patiently and unfashionably</li>
            <li>interesting ideas and mental models</li>
            <li>things that are simply worth understanding</li>
          </ul>
          <p>
            No forecasts, no hot takes, no advice. Just careful notes about things I find
            genuinely curious — collected here as an archive rather than a feed.
          </p>
        </div>

        <a
          href={SITE.substackSubscribeUrl}
          target="_blank"
          rel="noreferrer"
          className="pixel-frame-sm pixel-lift pixel-font mt-10 inline-block bg-primary px-4 py-3 text-[11px] text-primary-foreground"
        >
          Subscribe to the newsletter →
        </a>
      </section>
    </SiteShell>
  );
}
