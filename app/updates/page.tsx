"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PublicUpdateKind, PublicUpdatesTopic } from "@/lib/publicUpdates/types";

type ChangelogEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  details: string | null;
  topic: PublicUpdatesTopic;
  category?: string;
  factChecked: boolean;
  sourceName: string;
  sourceUrl: string | null;
  kind: PublicUpdateKind;
};

type ChangelogResponse = {
  entries: ChangelogEntry[];
  refreshedAt?: string;
  error?: string;
};

const TOPIC_FILTERS: { value: "all" | PublicUpdatesTopic; label: string }[] = [
  { value: "all", label: "All" },
  { value: "marketing", label: "Marketing" },
  { value: "digital_marketing", label: "Digital marketing" },
  { value: "advertising", label: "Advertising tips" },
  { value: "ascendra_public", label: "Ascendra" },
];

function topicBadgeClass(topic: PublicUpdatesTopic): string {
  switch (topic) {
    case "marketing":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "digital_marketing":
      return "bg-sky-500/15 text-sky-800 dark:text-sky-300";
    case "advertising":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-200";
    case "ascendra_public":
    default:
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  }
}

function UpdateCard({ entry }: { entry: ChangelogEntry }) {
  const [open, setOpen] = useState(false);
  const detailText = entry.details?.trim() ?? "";
  const hasExpandable = detailText.length > 0;

  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <time dateTime={entry.date}>{format(new Date(entry.date), "PPP p")}</time>
          <span aria-hidden>•</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
              topicBadgeClass(entry.topic),
            )}
          >
            {TOPIC_FILTERS.find((t) => t.value === entry.topic)?.label ?? entry.topic}
          </span>
          {entry.kind === "ascendra_editorial" && entry.factChecked ? (
            <>
              <span aria-hidden>•</span>
              <span className="text-emerald-700 dark:text-emerald-400">Ascendra verified</span>
            </>
          ) : entry.kind === "publisher_feed" ? (
            <>
              <span aria-hidden>•</span>
              <span>Publisher feed · verify at source</span>
            </>
          ) : null}
        </div>
        <CardTitle className="text-base sm:text-lg pr-8">{entry.title}</CardTitle>
        <CardDescription className="text-sm text-foreground/85 leading-relaxed">
          {entry.description}
        </CardDescription>
        <p className="text-xs text-muted-foreground mt-2">
          Source: <span className="font-medium text-foreground/80">{entry.sourceName}</span>
          {entry.sourceUrl ? (
            <>
              {" "}
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-violet-600 hover:underline dark:text-violet-400"
              >
                Open article
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </>
          ) : null}
        </p>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {hasExpandable ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 px-2 -ml-2 h-8 text-muted-foreground hover:text-foreground"
                aria-expanded={open}
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                  aria-hidden
                />
                {open ? "Hide detail" : "More detail"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {detailText}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function UpdatesPage() {
  const queryClient = useQueryClient();
  const [topicFilter, setTopicFilter] = useState<"all" | PublicUpdatesTopic>("all");

  const { data, isLoading, error, isFetching, dataUpdatedAt } = useQuery<ChangelogResponse>({
    queryKey: ["/api/changelog"],
    queryFn: async () => {
      const res = await fetch(`/api/changelog?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as ChangelogResponse;
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      return json;
    },
    staleTime: 12_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const entries = data?.entries ?? [];
  const filtered = useMemo(() => {
    if (topicFilter === "all") return entries;
    return entries.filter((e) => e.topic === topicFilter);
  }, [entries, topicFilter]);

  const liveLabel = useMemo(() => {
    const ts = data?.refreshedAt
      ? new Date(data.refreshedAt).getTime()
      : typeof dataUpdatedAt === "number"
        ? dataUpdatedAt
        : null;
    if (ts == null || Number.isNaN(ts)) return null;
    return formatDistanceToNow(ts, { addSuffix: true });
  }, [data?.refreshedAt, dataUpdatedAt]);

  return (
    <div className="min-h-screen w-full min-w-0 max-w-3xl mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold mb-2 flex flex-wrap items-center gap-2">
          <Sparkles className="h-8 w-8 text-violet-500 shrink-0" aria-hidden />
          Market updates
        </h1>
        <p className="text-muted-foreground max-w-prose">
          This page refreshes automatically from{" "}
          <strong className="font-medium text-foreground/90">major marketing, digital, and advertising publishers</strong>{" "}
          (RSS)—plus <strong className="font-medium text-foreground/90">Ascendra public</strong> items we mark verified in
          our CMS. <strong className="font-medium text-foreground/90">Internal and admin-only updates never appear here.</strong>{" "}
          Use <span className="font-medium text-foreground/85">More detail</span> for longer excerpts; for feed items, open
          the article at the publisher to fact-check claims at the source.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {liveLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <Radio
                className={cn("h-3.5 w-3.5", isFetching ? "text-amber-500 animate-pulse" : "text-emerald-600")}
                aria-hidden
              />
              Last merged {liveLabel}
              {isFetching ? " · fetching…" : ""}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full text-xs"
            disabled={isLoading || isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["/api/changelog"] });
            }}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} aria-hidden />
            Refresh now
          </Button>
        </div>
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="toolbar"
        aria-label="Filter updates by topic"
      >
        {TOPIC_FILTERS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={topicFilter === value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setTopicFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading updates" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              We couldn’t load updates right now. Please try again in a moment.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden />
            <p className="text-muted-foreground">
              {entries.length === 0
                ? "No updates to show yet. Check back soon."
                : "No items in this topic filter. Try All or another tab."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <UpdateCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
