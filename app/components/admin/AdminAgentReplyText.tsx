"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const INTERNAL_HREF = /^\/[a-zA-Z0-9/_-]*$/;

function isSafeExternalHttps(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

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
    } else if (isSafeExternalHttps(href)) {
      parts.push(
        <a
          key={`x-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium text-primary hover:opacity-90"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>
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
        <strong key={i} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
    }
    return <span key={i}>{renderMarkdownLinks(chunk)}</span>;
  });
}

/** Inline: `code`, **bold**, [label](/internal-path) */
function renderAssistantInline(segment: string): ReactNode {
  const parts = segment.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    const code = part.match(/^`([^`]+)`$/);
    if (code) {
      return (
        <code
          key={i}
          className="mx-px rounded bg-foreground/[0.08] px-1 py-0.5 font-mono text-[0.85em] leading-none dark:bg-foreground/15"
        >
          {code[1]}
        </code>
      );
    }
    return <Fragment key={i}>{renderBoldAndLinks(part)}</Fragment>;
  });
}

function parseBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let blockIdx = 0;
  const nextKey = () => `agent-block-${blockIdx++}`;

  type ListState = { ordered: boolean; items: string[] };
  let list: ListState | null = null;

  const flushList = () => {
    if (!list || list.items.length === 0) {
      list = null;
      return;
    }
    const { ordered, items } = list;
    list = null;
    const ListTag = ordered ? "ol" : "ul";
    out.push(
      <ListTag
        key={nextKey()}
        className={cn(
          "my-2 space-y-1.5 pl-4",
          ordered ?
            "list-decimal list-outside marker:text-muted-foreground"
          : "list-disc list-outside marker:text-muted-foreground"
        )}
      >
        {items.map((item, j) => (
          <li key={j} className="pl-0.5 leading-snug">
            {renderAssistantInline(item)}
          </li>
        ))}
      </ListTag>
    );
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "") {
      flushList();
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      i++;
      const codeBuf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeBuf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      out.push(
        <pre
          key={nextKey()}
          className="my-2 max-w-full overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-2.5 text-[11px] leading-relaxed dark:bg-muted/25"
        >
          <code className="block font-mono text-muted-foreground">{codeBuf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushList();
      out.push(<hr key={nextKey()} className="my-3 border-0 border-t border-border" />);
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const title = heading[2];
      out.push(
        <div
          key={nextKey()}
          className={cn(
            "font-semibold tracking-tight text-foreground",
            level <= 1 && "mt-3 border-b border-border/50 pb-1 text-sm first:mt-0",
            level === 2 && "mt-3 text-sm first:mt-0",
            level >= 3 && "mt-2.5 text-xs uppercase tracking-wide text-muted-foreground first:mt-0"
          )}
        >
          {renderAssistantInline(title)}
        </div>
      );
      i++;
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (bullet) {
      if (list?.ordered) flushList();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(bullet[1]);
      i++;
      continue;
    }
    if (numbered) {
      if (list && !list.ordered) flushList();
      if (!list) list = { ordered: true, items: [] };
      list.items.push(numbered[2]);
      i++;
      continue;
    }

    flushList();
    const para: string[] = [];
    while (i < lines.length) {
      const L = lines[i];
      const T = L.trim();
      if (T === "") break;
      if (T.startsWith("```")) break;
      if (/^---+$/.test(T)) break;
      if (/^#{1,6}\s/.test(T)) break;
      if (/^[-*]\s+/.test(T)) break;
      if (/^\d+[.)]\s+/.test(T)) break;
      para.push(L);
      i++;
    }
    out.push(
      <p key={nextKey()} className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">
        {para.map((pl, j) => (
          <Fragment key={j}>
            {j > 0 ? <br /> : null}
            {renderAssistantInline(pl)}
          </Fragment>
        ))}
      </p>
    );
  }

  flushList();
  return out;
}

interface AdminAgentReplyTextProps {
  text: string;
  className?: string;
}

/**
 * Renders admin assistant replies: headings (##), lists, `code`, **bold**,
 * [label](/internal-path) links, fenced blocks, and horizontal rules.
 */
export function AdminAgentReplyText({ text, className }: AdminAgentReplyTextProps) {
  const blocks = parseBlocks(text);
  return (
    <div className={cn("min-w-0 max-w-full text-left text-[13px] leading-relaxed text-foreground", className)}>
      {blocks}
    </div>
  );
}
