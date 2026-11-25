import type { ArticleStatus } from "@/lib/articles";
import { STATUS_SHORT } from "@/lib/articles";

const STYLES: Record<ArticleStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-accent text-accent-foreground",
  published_web: "bg-primary text-primary-foreground",
  exported_substack: "bg-ink text-background",
  failed: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`pixel-font border border-border px-2 py-1 text-[9px] ${STYLES[status]}`}
    >
      {STATUS_SHORT[status]}
    </span>
  );
}
