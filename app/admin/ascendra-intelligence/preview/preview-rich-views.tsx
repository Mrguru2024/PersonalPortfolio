"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MessageCircle,
  Sparkles,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type LandingPreviewData = {
  mode: "landing";
  offerSlug: string;
  name: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  ctaButton: string | null;
  ctaHref: string | null;
  bullets: string[];
};

export type DmPreviewData = {
  mode: "dm";
  plainText: string;
  charCount: number;
  personaDisplayName: string | null;
};

export type EmailPreviewData = {
  mode: "email";
  subject: string;
  htmlSanitizedNote: string;
  previewTextPlain: string;
  htmlSanitized: string;
};

function PreviewError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export function LandingOfferPreview({
  data,
  error,
}: {
  data: LandingPreviewData | null;
  error?: string | null;
}) {
  if (error) return <PreviewError message={error} />;
  if (!data || data.mode !== "landing") return null;

  const hasHero = !!(data.heroTitle || data.heroSubtitle);
  const hasCta = !!(data.ctaButton && data.ctaHref);
  const offerPath = `/offers/${data.offerSlug}`;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-xl shadow-primary/[0.07] dark:from-card dark:via-card dark:to-primary/10 dark:shadow-primary/5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.65] dark:opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -30%, hsl(var(--primary) / 0.22), transparent 55%), radial-gradient(ellipse 70% 40% at 100% 0%, hsl(var(--primary) / 0.12), transparent 50%), radial-gradient(ellipse 60% 35% at 0% 100%, hsl(var(--secondary) / 0.15), transparent 45%)",
          }}
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary" className="font-normal gap-1">
              <Sparkles className="h-3 w-3" aria-hidden />
              Live snapshot
            </Badge>
            {data.name ? (
              <Badge variant="outline" className="font-medium">
                {data.name}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground font-mono">{data.offerSlug}</span>
          </div>

          {hasHero ? (
            <header className="text-center max-w-3xl mx-auto space-y-4">
              {data.heroTitle ? (
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance leading-[1.1]">
                  {data.heroTitle}
                </h2>
              ) : null}
              {data.heroSubtitle ? (
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
                  {data.heroSubtitle}
                </p>
              ) : null}
            </header>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              No hero title or subtitle in stored sections yet.
            </p>
          )}

          {data.bullets.length > 0 ? (
            <ul className="mt-10 max-w-xl mx-auto space-y-3 text-left">
              {data.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 items-start text-sm sm:text-base">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-primary mt-0.5"
                    aria-hidden
                  />
                  <span className="text-foreground/90 leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasCta ? (
              <Button size="lg" className="min-h-12 px-8 text-base shadow-md" asChild>
                <Link href={data.ctaHref!} target="_blank" rel="noopener noreferrer">
                  {data.ctaButton}
                  <ExternalLink className="ml-2 h-4 w-4 opacity-80" aria-hidden />
                </Link>
              </Button>
            ) : data.ctaButton ? (
              <Button size="lg" disabled className="min-h-12">
                {data.ctaButton}
              </Button>
            ) : null}
            <Button variant="outline" size="lg" className="min-h-12" asChild>
              <Link href={offerPath} target="_blank" rel="noopener noreferrer">
                Open live offer page
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {(data.metaTitle || data.metaDescription) && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 sm:px-5 sm:py-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Type className="h-3.5 w-3.5" aria-hidden />
            SEO meta (stored)
          </div>
          {data.metaTitle ? (
            <p className="text-sm font-medium text-foreground">{data.metaTitle}</p>
          ) : null}
          {data.metaDescription ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{data.metaDescription}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DmRichPreview({
  data,
  error,
}: {
  data: DmPreviewData | null;
  error?: string | null;
}) {
  if (error) return <PreviewError message={error} />;
  if (!data || data.mode !== "dm") return null;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[380px]">
        <div
          className="rounded-[2rem] border-[10px] border-muted bg-muted/40 p-3 shadow-2xl shadow-black/20 dark:shadow-black/40"
          aria-label="DM preview frame"
        >
          <div className="rounded-[1.35rem] overflow-hidden bg-background border border-border/80 shadow-inner">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/80 bg-muted/20">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex-1 text-center pr-14">
                Preview
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4 min-h-[220px] bg-gradient-to-b from-background to-muted/15">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {data.personaDisplayName || "Message"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Direct message</p>
                </div>
              </div>
              <div className="rounded-2xl rounded-tl-md bg-primary/10 dark:bg-primary/15 border border-primary/15 px-4 py-3">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {data.plainText || (
                    <span className="text-muted-foreground italic">Empty message</span>
                  )}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border/80 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Character count
              </span>
              <Badge variant="secondary" className="font-mono tabular-nums">
                {data.charCount}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailRichPreview({
  data,
  error,
}: {
  data: EmailPreviewData | null;
  error?: string | null;
}) {
  if (error) return <PreviewError message={error} />;
  if (!data || data.mode !== "email") return null;

  const srcDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#111;background:#fff;} img{max-width:100%;height:auto;}</style></head><body>${data.htmlSanitized}</body></html>`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30 text-sm">
          <Mail className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <span className="text-muted-foreground truncate">Inbox</span>
        </div>
        <div className="px-4 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p>
          <p className="text-lg font-semibold text-foreground leading-snug">{data.subject}</p>
        </div>
        <Separator />
        <div className="bg-zinc-100 dark:bg-zinc-950 p-3 sm:p-4">
          <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden />
            Rendered HTML (scripts stripped)
          </p>
          <div className="rounded-lg overflow-hidden border border-border/60 bg-white shadow-md">
            <iframe
              title="Email HTML preview"
              className="w-full min-h-[min(70vh,560px)] bg-white"
              sandbox=""
              srcDoc={srcDoc}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
        {data.htmlSanitizedNote}
      </div>

      <div className="rounded-xl border bg-muted/20 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">Plain-text excerpt</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{data.previewTextPlain}</p>
      </div>
    </div>
  );
}
