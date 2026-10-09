import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteSearch } from "./SiteSearch";
import { ThemeToggle } from "./ThemeToggle";
import { SITE } from "@/lib/site";
import { shouldCollapseHeader } from "@/lib/header-rules";

const NAV = [
  { to: "/", label: "Home" }, { to: "/Market-Pulse", label: "Market Pulse" },
  { to: "/articles", label: "Articles" }, { to: "/cfa-exam", label: "CFA Exam" },
  { to: "/categories", label: "Categories" }, { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState<number>();
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => setCollapsed(shouldCollapseHeader(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (collapsed || !headerRef.current) return;
    const element = headerRef.current;
    const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, [collapsed, open]);

  return (
    <div style={collapsed ? { height } : undefined}>
      <header ref={headerRef} data-collapsed={collapsed} className={`site-header z-40 border-t-4 border-ink bg-paper shadow-[var(--shadow-pixel-sm)] ${collapsed ? "fixed inset-x-0 top-0" : "sticky top-0"}`}>
        <div className="header-inner mx-auto max-w-6xl px-4 sm:px-6">
          <Link to="/" className="header-logo text-ink transition-colors hover:text-primary" aria-label="The Context home">
            <span className="display-font italic leading-none">The Context</span>
          </Link>
          <nav className="header-nav font-display not-italic" aria-label="Main navigation">
            {NAV.map((item) => <Link key={item.to} to={item.to} className="whitespace-nowrap text-base font-normal not-italic tracking-normal text-foreground hover:text-primary" activeOptions={{ exact: item.to === "/" }} activeProps={{ className: "text-primary" }}>{item.label}</Link>)}
          </nav>
          <div className="header-tools flex items-center justify-end gap-1 sm:gap-2">
            <SiteSearch />
            <ThemeToggle />
            <Button asChild size="sm" className="font-editorial-ui text-sm"><a href={SITE.substackSubscribeUrl} target="_blank" rel="noreferrer">Subscribe</a></Button>
            <Button variant="ghost" size="icon" aria-label="Toggle menu" aria-expanded={open} aria-controls="header-mobile-nav" onClick={() => setOpen((value) => !value)} className="md:hidden">{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</Button>
          </div>
        </div>
        {open ? <nav id="header-mobile-nav" aria-label="Mobile navigation" className="grid grid-cols-2 gap-x-6 border-t border-border px-4 py-3 font-display not-italic md:hidden">{NAV.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="py-2 text-base font-normal not-italic tracking-normal hover:text-primary">{item.label}</Link>)}</nav> : null}
      </header>
    </div>
  );
}