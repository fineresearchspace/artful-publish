import { useState, useRef } from "react";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Link2, Image, Table, Code, Minus, Type, Palette,
  FileSpreadsheet, Frame,
} from "lucide-react";

type InsertFn = (before: string, after?: string, placeholder?: string) => void;

type Panel = "size" | "color" | "table-import" | "embed" | null;

const TABLE_SNIPPET = `\n| Column | Column |\n| --- | --- |\n| Value | Value |\n`;

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40];

/** Converts data pasted from Excel/Sheets (tab or comma separated) into a markdown table */
function parseTableData(raw: string): string {
  const rows = raw
    .trim()
    .split("\n")
    .map((r) => r.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim()));

  const header = rows[0];
  if (!header || rows.length === 0) return "";

  const body = rows.slice(1);

  const headerRow = `| ${header.join(" | ")} |`;
  const dividerRow = `| ${header.map(() => "---").join(" | ")} |`;
  const bodyRows = body.map((r) => `| ${r.join(" | ")} |`).join("\n");

  return `\n${headerRow}\n${dividerRow}\n${bodyRows}\n`;
}

export function EditorToolbar({ onInsert }: { onInsert: InsertFn }) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [importText, setImportText] = useState<string>("");
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const closePanel = () => setOpenPanel(null);

  const buttons: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Heading1, label: "Heading 1", run: () => onInsert("\n# ", "", "Heading") },
    { icon: Heading2, label: "Heading 2", run: () => onInsert("\n## ", "", "Heading") },
    { icon: Heading3, label: "Heading 3", run: () => onInsert("\n### ", "", "Heading") },
    { icon: Bold, label: "Bold", run: () => onInsert("**", "**", "bold text") },
    { icon: Italic, label: "Italic", run: () => onInsert("_", "_", "italic text") },
    { icon: Link2, label: "Link", run: () => onInsert("[", "](https:)", "link text") },
    { icon: List, label: "Bullet list", run: () => onInsert("\n- ", "", "item") },
    { icon: ListOrdered, label: "Numbered list", run: () => onInsert("\n1. ", "", "item") },
    { icon: Quote, label: "Quote", run: () => onInsert("\n> ", "", "quote") },
    { icon: Image, label: "Image", run: () => onInsert("\n![alt](", ")", "https://") },
    { icon: Table, label: "Table", run: () => onInsert(TABLE_SNIPPET) },
    { icon: Code, label: "Code block", run: () => onInsert("\n```\n", "\n```\n", "code") },
    { icon: Minus, label: "Separator", run: () => onInsert("\n\n---\n\n") },
  ];

  return (
    <div className="relative flex flex-wrap gap-1 border-2 border-ink bg-muted p-2">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          title={b.label}
          aria-label={b.label}
          onClick={b.run}
          className="border-2 border-transparent p-1.5 hover:border-ink hover:bg-paper"
        >
          <b.icon className="size-3.5" />
        </button>
      ))}

      <div className="mx-1 w-px bg-ink/30" />

      {/* Font size */}
      <button
        type="button"
        title="Font size"
        aria-label="Font size"
        onClick={() => setOpenPanel((prev) => (prev === "size" ? null : "size"))}
        className="border-2 border-transparent p-1.5 hover:border-ink hover:bg-paper"
      >
        <Type className="size-3.5" />
      </button>

      {/* Font color */}
      <button
        type="button"
        title="Font color"
        aria-label="Font color"
        onClick={() => colorInputRef.current?.click()}
        className="border-2 border-transparent p-1.5 hover:border-ink hover:bg-paper"
      >
        <Palette className="size-3.5" />
      </button>
      <input
        ref={colorInputRef}
        type="color"
        className="hidden"
        onChange={(e) => {
          const value = e.target.value;
          onInsert(`<span style="color:${value}">`, "</span>", "colored text");
        }}
      />

      {/* Table import (from Excel/Sheets paste) */}
      <button
        type="button"
        title="Import table from Excel/Sheets"
        aria-label="Import table"
        onClick={() => setOpenPanel((prev) => (prev === "table-import" ? null : "table-import"))}
        className="border-2 border-transparent p-1.5 hover:border-ink hover:bg-paper"
      >
        <FileSpreadsheet className="size-3.5" />
      </button>

      {/* Rich URL embed (YouTube, Sheets, etc.) */}
      <button
        type="button"
        title="Embed URL"
        aria-label="Embed URL"
        onClick={() => setOpenPanel((prev) => (prev === "embed" ? null : "embed"))}
        className="border-2 border-transparent p-1.5 hover:border-ink hover:bg-paper"
      >
        <Frame className="size-3.5" />
      </button>

      {/* --- Popover panels --- */}
      {openPanel === "size" && (
        <div className="absolute left-0 top-full z-10 mt-1 flex flex-wrap gap-1 border-2 border-ink bg-paper p-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => {
                onInsert(`<span style="font-size:${size}px">`, "</span>", "text");
                closePanel();
              }}
              className="border-2 border-transparent px-2 py-1 text-xs hover:border-ink hover:bg-muted"
            >
              {size}px
            </button>
          ))}
        </div>
      )}

      {openPanel === "table-import" && (
        <div className="absolute left-0 top-full z-10 mt-1 w-96 border-2 border-ink bg-paper p-3">
          <p className="mb-2 text-xs">Paste cells copied from Excel or Google Sheets:</p>
          <textarea
            autoFocus
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"Column A\tColumn B\nValue 1\tValue 2"}
            className="h-24 w-full border-2 border-ink bg-white p-2 text-xs"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closePanel}
              className="border-2 border-ink px-2 py-1 text-xs hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (importText.trim()) onInsert(parseTableData(importText));
                setImportText("");
                closePanel();
              }}
              className="border-2 border-ink bg-yellow-200 px-2 py-1 text-xs hover:bg-yellow-300"
            >
              Insert table
            </button>
          </div>
        </div>
      )}

      {openPanel === "embed" && (
        <div className="absolute left-0 top-full z-10 mt-1 w-80 border-2 border-ink bg-paper p-3">
          <p className="mb-2 text-xs">
            Paste a URL to embed (YouTube, Google Sheets, CodePen, etc.):
          </p>
          <input
            autoFocus
            type="text"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border-2 border-ink bg-white p-2 text-xs"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={closePanel}
              className="border-2 border-ink px-2 py-1 text-xs hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (embedUrl.trim()) {
                  onInsert(
                    `\n<iframe src="${embedUrl.trim()}" width="100%" height="400" frameborder="0"></iframe>\n`
                  );
                }
                setEmbedUrl("");
                closePanel();
              }}
              className="border-2 border-ink bg-yellow-200 px-2 py-1 text-xs hover:bg-yellow-300"
            >
              Insert embed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}