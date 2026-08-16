import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image,
  Table,
  Code,
  Minus,
} from "lucide-react";

type InsertFn = (before: string, after?: string, placeholder?: string) => void;

const TABLE_SNIPPET = `\n| Column | Column |\n| --- | --- |\n| Value | Value |\n`;

export function EditorToolbar({ onInsert }: { onInsert: InsertFn }) {
  const buttons: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Heading1, label: "Heading 1", run: () => onInsert("\n# ", "", "Heading") },
    { icon: Heading2, label: "Heading 2", run: () => onInsert("\n## ", "", "Heading") },
    { icon: Heading3, label: "Heading 3", run: () => onInsert("\n### ", "", "Heading") },
    { icon: Bold, label: "Bold", run: () => onInsert("**", "**", "bold text") },
    { icon: Italic, label: "Italic", run: () => onInsert("*", "*", "italic text") },
    { icon: Link2, label: "Link", run: () => onInsert("[", "](https://)", "link text") },
    { icon: List, label: "Bullet list", run: () => onInsert("\n- ", "", "item") },
    { icon: ListOrdered, label: "Numbered list", run: () => onInsert("\n1. ", "", "item") },
    { icon: Quote, label: "Quote", run: () => onInsert("\n> ", "", "quote") },
    { icon: Image, label: "Image", run: () => onInsert("\n![alt](", ")", "https://") },
    { icon: Table, label: "Table", run: () => onInsert(TABLE_SNIPPET) },
    { icon: Code, label: "Code block", run: () => onInsert("\n```\n", "\n```\n", "code") },
    { icon: Minus, label: "Separator", run: () => onInsert("\n\n---\n\n") },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-2 border-ink bg-muted p-2">
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
    </div>
  );
}
