"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const INTERNAL_HREF = /^\/[a-zA-Z0-9/_-]*$/;

function renderMarkdownLinks(segment: string): ReactNode {
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(segment)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t-${key++}`}>{segment.slice(last, m.index)}</span>);
    }
    const label = m[1];
    const href = m[2];
    if (INTERNAL_HREF.test(href)) {
      parts.push(
        <Link
          key={`a-${key++}`}
          href={href}
          className="underline font-medium text-primary hover:opacity-90"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </Link>
      );
    } else {
      parts.push(<span key={`r-${key++}`}>{m[0]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < segment.length) {
    parts.push(<span key={`e-${key++}`}>{segment.slice(last)}</span>);
  }
  return parts.length > 0 ? parts : segment;
}

function renderBoldAndLinks(segment: string): ReactNode {
  const chunks = segment.split(/(\*\*[^*]+\*\*)/g);
  return chunks.map((chunk, i) => {
    const bold = chunk.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={i} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    return <span key={i}>{renderMarkdownLinks(chunk)}</span>;
  });
}

interface AdminAgentReplyTextProps {
  text: string;
  className?: string;
}

/**
 * Renders assistant replies: newlines, **bold**, and [label](/internal-path) as Next.js links.
 */
export function AdminAgentReplyText({ text, className }: AdminAgentReplyTextProps) {
  const lines = text.split("\n");
  return (
    <div className={className ?? "whitespace-pre-wrap break-words text-left"}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {renderBoldAndLinks(line)}
        </Fragment>
      ))}
    </div>
  );
}
