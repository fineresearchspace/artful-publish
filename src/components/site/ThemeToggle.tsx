import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "the-context-theme";

type Theme = "light" | "dark";

function setDocumentTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const current = stored === "dark" || stored === "light" ? stored : preferred;
    setTheme(current);
    setDocumentTheme(current);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Use ${nextTheme === "dark" ? "dark" : "daylight"} theme`}
      title={`Use ${nextTheme === "dark" ? "dark" : "daylight"} theme`}
      onClick={() => {
        setTheme(nextTheme);
        setDocumentTheme(nextTheme);
        window.localStorage.setItem(THEME_KEY, nextTheme);
      }}
      className="rounded-full text-muted-foreground hover:text-foreground"
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}