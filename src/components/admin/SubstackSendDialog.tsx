import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Send, X, ExternalLink } from "lucide-react";
import type { Article } from "@/lib/articles";
import { substackProvider } from "@/lib/publishing/substack";
import { loadSettings } from "@/lib/site";

/** Copies rich HTML so a paste into the Substack editor keeps all formatting. */
async function copyRich(html: string, plain: string) {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
    return true;
  } catch {
    return false;
  }
}

export function SubstackSendDialog({
  draft,
  onSent,
  open: openProp,
  onOpenChange,
}: {
  draft: Article;
  onSent?: (() => void | Promise<void>) | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  };
  const exported = substackProvider.exportPost(draft);
  const composeUrl = `${loadSettings().substackUrl}/publish/post?type=newsletter`;


  async function send() {
    const ok = await copyRich(exported.html, exported.markdown);
    if (!ok) {
      toast.error("Clipboard blocked — use the copy buttons below instead");
      return;
    }
    window.open(composeUrl, "_blank", "noopener");
    toast.success("Newsletter copied — paste it into the Substack editor that just opened");
    setOpen(false);
    void onSent?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pixel-font flex w-full items-center justify-center gap-2 border border-border bg-primary px-3 py-2 text-[10px] text-primary-foreground"
      >
        <Send className="size-3.5" /> Preview &amp; send to Substack
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8">
              <div className="pixel-frame w-full max-w-3xl bg-paper">
                <div className="flex items-center gap-3 border-b border-border p-4">
                  <p className="pixel-font text-[10px] text-primary">
                    Newsletter preview
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ml-auto border border-border p-1.5"
                    aria-label="Close preview"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                  <h1 className="font-serif text-3xl">{exported.title || "Untitled"}</h1>
                  {exported.subtitle ? (
                    <p className="mt-2 font-serif text-lg text-muted-foreground">
                      {exported.subtitle}
                    </p>
                  ) : null}
                  <div
                    className="article-prose mt-6"
                    dangerouslySetInnerHTML={{ __html: exported.html }}
                  />
                </div>

                <div className="space-y-3 border-t border-border p-4">
                  <p className="text-[11px] text-muted-foreground">
                    Substack does not allow other apps to post on your behalf, so this
                    copies the finished newsletter exactly as shown and opens a new
                    Substack post for you — paste once and hit send there.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void send()}
                      className="pixel-font flex items-center justify-center gap-2 border border-border bg-primary px-3 py-2 text-[10px] text-primary-foreground"
                    >
                      <ExternalLink className="size-3.5" /> Copy &amp; open Substack
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="pixel-font border border-border px-3 py-2 text-[10px]"
                    >
                      Keep editing
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
