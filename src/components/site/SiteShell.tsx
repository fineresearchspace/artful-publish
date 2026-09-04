import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/Market-Pulse", label: "Market Pulse" },
  { to: "/articles", label: "Articles" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="pixel-font text-base sm:text-lg text-ink">
            Weekly Wonders
          </Link>

          <nav className="ml-auto hidden items-center gap-5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="pixel-font text-[11px] text-muted-foreground transition-colors hover:text-primary"
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "pixel-font text-[11px] text-primary" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.substackUrl}
              target="_blank"
              rel="noreferrer"
              className="pixel-frame-sm pixel-lift pixel-font bg-accent px-3 py-2 text-[11px] text-accent-foreground"
            >
              Read on Substack →
            </a>
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto md:hidden pixel-panel p-2"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {open ? (
          <nav className="flex flex-col gap-1 border-t border-border bg-paper px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="pixel-font py-2 text-xs"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={SITE.substackUrl}
              target="_blank"
              rel="noreferrer"
              className="pixel-font py-2 text-xs text-primary"
            >
              Read on Substack →
            </a>
          </nav>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="pixel-font text-sm text-ink">Weekly Wonders</p>
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
          <div className="flex flex-col gap-3">
            <span className="pixel-font text-[10px] text-muted-foreground">Newsletter</span>
            <a
              href={SITE.substackSubscribeUrl}
              target="_blank"
              rel="noreferrer"
              className="pixel-frame-sm pixel-lift pixel-font bg-primary px-4 py-2 text-[11px] text-primary-foreground"
            >
              Newsletter →
            </a>
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
            © {new Date().getFullYear()} Weekly Wonders ·{" "}
            <Link to="/admin" className="hover:text-primary">
              Studio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
