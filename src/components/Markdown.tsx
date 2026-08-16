import { marked } from "marked";
import { useMemo } from "react";

marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown ?? "", { async: false }) as string;
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
