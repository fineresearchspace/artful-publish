import { toast } from "sonner";
import { Copy, Download, ExternalLink } from "lucide-react";
import type { Article } from "@/lib/articles";
import { substackProvider } from "@/lib/publishing/substack";
import { loadSettings } from "@/lib/site";

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copy(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Clipboard unavailable in this browser");
  }
}

export function SubstackPanel({ draft }: { draft: Article }) {
  const exported = substackProvider.exportPost(draft);
  const slug = draft.slug || "article";

  return (
    <div className="pixel-panel space-y-3 p-4">
      <p className="pixel-font text-[10px] text-primary">Export for Substack</p>
      <p className="text-xs text-muted-foreground">
        Substack has no official public publishing API, so Weekly Wonders prepares the post
        for a clean paste instead of pretending to send it.
      </p>

      <div className="grid gap-2">
        <button
          onClick={() => void copy("Formatted article", exported.html)}
          className="pixel-font flex items-center gap-2 border-2 border-ink bg-accent px-3 py-2 text-[10px] text-accent-foreground"
        >
          <Copy className="size-3.5" /> Copy formatted article
        </button>
        <button
          onClick={() => void copy("Markdown", exported.markdown)}
          className="pixel-font flex items-center gap-2 border-2 border-ink px-3 py-2 text-[10px]"
        >
          <Copy className="size-3.5" /> Copy Markdown
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => download(`${slug}.md`, exported.markdown, "text/markdown")}
            className="pixel-font flex items-center gap-1 border-2 border-ink px-2 py-2 text-[10px]"
          >
            <Download className="size-3.5" /> .md
          </button>
          <button
            onClick={() => download(`${slug}.html`, exported.html, "text/html")}
            className="pixel-font flex items-center gap-1 border-2 border-ink px-2 py-2 text-[10px]"
          >
            <Download className="size-3.5" /> .html
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => void copy("Title", exported.title)}
            className="pixel-font border-2 border-ink px-2 py-2 text-[10px]"
          >
            Copy title
          </button>
          <button
            onClick={() => void copy("Subtitle", exported.subtitle)}
            className="pixel-font border-2 border-ink px-2 py-2 text-[10px]"
          >
            Copy subtitle
          </button>
          <button
            onClick={() => void copy("Excerpt", exported.excerpt)}
            className="pixel-font border-2 border-ink px-2 py-2 text-[10px]"
          >
            Copy excerpt
          </button>
          <button
            onClick={() => void copy("Tags", exported.tags)}
            className="pixel-font border-2 border-ink px-2 py-2 text-[10px]"
          >
            Copy tags
          </button>
        </div>
        <a
          href={`${loadSettings().substackUrl}/publish/post?type=newsletter`}
          target="_blank"
          rel="noreferrer"
          className="pixel-font flex items-center gap-2 border-2 border-ink px-3 py-2 text-[10px]"
        >
          <ExternalLink className="size-3.5" /> Open Substack editor
        </a>
      </div>

      <p className="text-[11px] text-muted-foreground">
        After posting, paste the Substack link above and set the status to “Published to
        Substack”.
      </p>
    </div>
  );
}
