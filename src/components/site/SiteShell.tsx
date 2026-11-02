import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { SITE } from "@/lib/site";
import { HeadlineTicker } from "@/components/site/HeadlineTicker";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { SiteHeader } from "@/components/site/SiteHeader";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/Market-Pulse", label: "Market Pulse" },
  { to: "/articles", label: "Articles" },
  { to: "/cfa-exam", label: "CFA Exam" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <HeadlineTicker />

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="text-sm text-muted-foreground">{SITE.tagline}</p>
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
