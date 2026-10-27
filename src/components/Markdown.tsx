import { marked } from "marked";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

marked.setOptions({ gfm: true, breaks: false });

// Sanitize schema: allow standard markdown tags plus safe styling attributes.
// Deliberately excludes style attributes and dangerous tags to prevent XSS.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? [])],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.["a"] ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.["img"] ?? []), "alt", "width", "height"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

interface MarkdownProps {
  content: string;
  className?: string;
}

/** True when the stored content is already rich HTML (produced by the editor). */
export function isHtmlContent(value: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|table|img|figure|div|hr)\b/i.test(value ?? "");
}

/**
 * Renders markdown to a sanitized HTML string.
 * Used by the Substack export provider for HTML export.
 */
export function renderMarkdown(markdown: string): string {
  const value = markdown ?? "";
  if (isHtmlContent(value)) return value;
  return marked.parse(value, { async: false }) as string;
}

export function Markdown({ content, className }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div className={cn("article-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          a: ({ ...props }) => (
            <a
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          img: ({ ...props }) => (
            <img
              className="pixelated my-4 max-w-full border-2 border-ink"
              {...props}
              alt={props.alt ?? ""}
            />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-ink pl-4 italic text-muted-foreground"
              {...props}
            />
          ),
          code: ({ ...props }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props} />
          ),
          pre: ({ ...props }) => (
            <pre
              className="my-4 overflow-x-auto border-2 border-ink bg-muted p-4 font-mono text-sm"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}