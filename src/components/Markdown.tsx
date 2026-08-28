import { marked } from "marked";
import { useMemo } from "react";

marked.setOptions({ gfm: true, breaks: false });

/** True when the stored content is already rich HTML (produced by the editor). */
export function isHtmlContent(value: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|table|img|figure|div|hr)\b/i.test(value ?? "");
}

export function renderMarkdown(markdown: string): string {
  const value = markdown ?? "";
  if (isHtmlContent(value)) return value;
  return marked.parse(value, { async: false }) as string;
}


export function Markdown({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className={`article-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
