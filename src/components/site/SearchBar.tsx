import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search wonders…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="pixel-panel flex items-center gap-3 px-3 py-2">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search articles"
        className="pixel-font w-full bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
      />
      {value ? null : <span className="blink-caret pixel-font text-[11px]">_</span>}
    </label>
  );
}
