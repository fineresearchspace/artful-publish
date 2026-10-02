import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { HeadlineTicker } from "@/components/site/HeadlineTicker";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { SiteSearch } from "@/components/site/SiteSearch";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import logoAsset from "@/assets/the-context-logo.png.asset.json";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/Market-Pulse", label: "Market Pulse" },
  { to: "/articles", label: "Articles" },
  { to: "/cfa-exam", label: "CFA Exam" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative z-40 border-t-4 border-ink bg-paper shadow-[var(--shadow-pixel-sm)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex min-h-11 items-center justify-between border-b border-border font-editorial-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Link to="/" className="flex items-center gap-3 transition-colors hover:text-primary">
              <img
                src={logoAsset.url}
                alt="The Context logo"
                className="h-7 w-auto rounded-sm"
              />
              <span className="hidden sm:inline">Independent financial publication</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <SiteSearch />
              <ThemeToggle />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Toggle menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="rounded-full md:hidden"
              >
                {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </Button>
            </div>
          </div>

          <div className="py-5 text-center sm:py-7">
            <Link to="/" className="inline-block text-ink transition-colors hover:text-primary">
              <span className="display-font block text-5xl italic leading-none sm:text-6xl lg:text-7xl">
                The Context
              </span>
            </Link>
            <p className="mt-2 font-serif text-sm italic text-primary sm:text-base">
              Markets, explained in context.
            </p>
          </div>

          <div className="hidden items-center justify-between border-y-2 border-ink py-3 md:flex">
            <nav className="flex items-center gap-5 font-editorial-ui lg:gap-7">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:text-primary"
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-primary" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <a
              href={SITE.substackUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-ink px-6 py-2 font-editorial-ui text-[10px] font-semibold uppercase tracking-[0.14em] text-background shadow-[var(--shadow-pixel-sm)] transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-90"
            >
              Read on Substack →
            </a>
          </div>

          {open ? (
            <nav className="grid grid-cols-2 gap-x-6 gap-y-1 border-t-2 border-ink py-3 font-editorial-ui md:hidden">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={SITE.substackUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 mt-2 bg-ink px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-background"
              >
                Read on Substack →
              </a>
            </nav>
          ) : null}
        </div>
        <div className="h-4 sm:h-5" aria-hidden="true" />
      </header>

      <HeadlineTicker />

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <img
              src={logoAsset.url}
              alt="The Context logo"
              className="h-12 w-auto rounded-md"
            />
            <p className="mt-3 text-sm text-muted-foreground">{SITE.tagline}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="pixel-font text-[10px] text-muted-foreground">Explore</span>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm hover:text-primary">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3 md:w-auto">
            <NewsletterSignup />
            <a
              href={SITE.substackUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm hover:text-primary"
            >
              Read on Substack
            </a>
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center sm:px-6">
          <p className="pixel-font text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} The Context ·{" "}
            <Link to="/admin" className="hover:text-primary">
              Studio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
