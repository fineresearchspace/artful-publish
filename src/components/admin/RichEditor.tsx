import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Link2, Image as ImageIcon, Table as TableIcon, Code, Minus,
  Type, Palette, Undo2, Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40];

/** Uploads an image file to storage and returns its public URL. */
async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("article-images")
    .upload(fileName, file, { contentType: file.type || "image/png" });
  if (error) {
    toast.error(`Image upload failed: ${error.message}`);
    return null;
  }
  const { data: urlData } = supabase.storage
    .from("article-images")
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}

/** Converts tab/comma separated clipboard cells into a real table in the doc. */
function insertTableFromText(editor: Editor, raw: string) {
  const rows = raw
    .trim()
    .split("\n")
    .map((r) => r.split("\t").map((c) => c.trim()));
  const cols = rows[0]?.length ?? 0;
  if (cols < 2) return false;

  editor
    .chain()
    .focus()
    .insertTable({ rows: rows.length, cols, withHeaderRow: true })
    .run();

  // Fill cells left-to-right, top-to-bottom.
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) editor.chain().focus().insertContent(cell).run();
      const isLast = rowIndex === rows.length - 1 && colIndex === row.length - 1;
      if (!isLast) editor.chain().focus().goToNextCell().run();
    });
  });
  return true;
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`border-2 p-1.5 hover:border-ink hover:bg-paper ${
        active ? "border-ink bg-paper" : "border-transparent"
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export function RichEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastEmitted = useRef(content);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      TextStyleKit.configure({ fontFamily: false, lineHeight: false }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "article-prose min-h-[520px] max-w-none border-2 border-t-0 border-ink bg-paper p-4 outline-none",
      },
      handlePaste: (view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard || !editor) return false;

        // 1. Pasted images / screenshots → upload and embed as real images.
        const imageFiles = Array.from(clipboard.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (imageFiles.length > 0) {
          event.preventDefault();
          void (async () => {
            for (const file of imageFiles) {
              const url = await uploadImage(file);
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }
          })();
          return true;
        }

        // 2. Pasted spreadsheet cells → real table (only when no HTML available).
        const text = clipboard.getData("text/plain");
        const html = clipboard.getData("text/html");
        if (!html && text.includes("\t") && text.includes("\n")) {
          if (insertTableFromText(editor, text)) {
            event.preventDefault();
            return true;
          }
        }

        // 3. Rich text → ProseMirror parses & sanitizes it into clean nodes.
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Sync external content changes (e.g. article loaded from the database).
  useEffect(() => {
    if (!editor) return;
    if (content === lastEmitted.current) return;
    lastEmitted.current = content;
    editor.commands.setContent(content || "", { emitUpdate: false });
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[560px] border-2 border-ink bg-paper p-4 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link")["href"] as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="relative">
      <div className="relative flex flex-wrap gap-1 border-2 border-ink bg-muted p-2">
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={Heading3}
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={Link2}
          label="Link"
          active={editor.isActive("link")}
          onClick={setLink}
        />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={Quote}
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon={Code}
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolbarButton
          icon={Minus}
          label="Separator"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          icon={TableIcon}
          label="Table"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        />
        <ToolbarButton
          icon={ImageIcon}
          label="Insert image"
          onClick={() => fileInputRef.current?.click()}
        />

        <div className="mx-1 w-px bg-ink/30" />

        <ToolbarButton
          icon={Type}
          label="Font size"
          active={sizeOpen}
          onClick={() => setSizeOpen((v) => !v)}
        />
        <ToolbarButton
          icon={Palette}
          label="Font color"
          onClick={() => colorInputRef.current?.click()}
        />

        <div className="mx-1 w-px bg-ink/30" />

        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        />

        <input
          ref={colorInputRef}
          type="color"
          className="hidden"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const url = await uploadImage(file);
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        />

        {sizeOpen ? (
          <div className="absolute left-0 top-full z-10 mt-1 flex flex-wrap gap-1 border-2 border-ink bg-paper p-2">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setFontSize(`${size}px`).run();
                  setSizeOpen(false);
                }}
                className="border-2 border-transparent px-2 py-1 text-xs hover:border-ink hover:bg-muted"
              >
                {size}px
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetFontSize().run();
                setSizeOpen(false);
              }}
              className="border-2 border-transparent px-2 py-1 text-xs hover:border-ink hover:bg-muted"
            >
              Reset
            </button>
          </div>
        ) : null}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
