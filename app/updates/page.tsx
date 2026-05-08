"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, ExternalLink, Loader2, Radio, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UpdatesFeedItem } from "@/lib/updatesFeedTypes";
import {
  UPDATES_TOPIC_IDS,
  UPDATES_TOPIC_LABELS,
  UPDATES_TOPIC_SOURCE_NOTES,
  type UpdatesTopicId,
} from "@/lib/updatesFeedTopics";

/** Poll faster than server cache so revisits pick up fresh merges quickly. */
const POLL_MS = 30_000;

type TabValue = "all" | UpdatesTopicId;

function itemMatchesTab(item: UpdatesFeedItem, tab: TabValue): boolean {
  if (tab === "all") return true;
  return item.topics.includes(tab);
}

function FeedCard({ item }: { item: UpdatesFeedItem }) {
  const dateLabel = format(new Date(item.publishedAt), "PPP");
  const isExternal = item.kind === "rss";
  const href = item.url ?? undefined;

  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <time dateTime={item.publishedAt}>{dateLabel}</time>
          </span>
          <span aria-hidden>•</span>
          <Badge variant="secondary" className="font-normal text-xs">
            {item.sourceName}
          </Badge>
          {item.kind === "ascendra_note" ? (
            <>
              <span aria-hidden>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">Verified note</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.topics.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
              {UPDATES_TOPIC_LABELS[t]}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-base sm:text-lg leading-snug">
          {href ? (
            isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-violet-600 dark:hover:text-violet-400 underline-offset-4 hover:underline inline-flex items-start gap-1.5"
              >
                <span>{item.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 opacity-70" aria-hidden />
              </a>
            ) : (
              <Link
                href={href}
                className="hover:text-violet-600 dark:hover:text-violet-400 underline-offset-4 hover:underline"
              >
                {item.title}
              </Link>
            )
          ) : (
            item.title
          )}
        </CardTitle>
        <CardDescription className="text-sm text-foreground/80 leading-relaxed">{item.summary}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function UpdatesPage() {
  const [tab, setTab] = useState<TabValue>("all");

  const { data, isLoading, isFetching, error, dataUpdatedAt } = useQuery({
    queryKey: ["/api/updates-feed"],
    queryFn: async () => {
      const res = await fetch("/api/updates-feed", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      return json as { items: UpdatesFeedItem[]; generatedAt: string; cacheTtlMs: number; error?: string };
    },
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const items = data?.items ?? [];

  const filtered = useMemo(() => items.filter((i) => itemMatchesTab(i, tab)), [items, tab]);

  const lastUpdated =
    dataUpdatedAt && !Number.isNaN(dataUpdatedAt)
      ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true })
      : null;

  return (
    <div className="min-h-screen w-full min-w-0 max-w-3xl mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-violet-500 shrink-0" aria-hidden />
          Live marketing &amp; industry feed
        </h1>
        <p className="text-muted-foreground">
          Marketing, how-tos, digital marketing, industry news, and Ascendra public updates from hand-picked RSS sources.
          The feed refreshes automatically while you keep this tab open, and when you return to it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 text-violet-500 shrink-0" aria-hidden />
            Auto-refresh about every {Math.max(1, Math.round(POLL_MS / 1000))} sec
          </span>
          {lastUpdated ? (
            <>
              <span aria-hidden>•</span>
              <span>Last fetched {lastUpdated}</span>
            </>
          ) : null}
          {isFetching && !isLoading ? <span className="text-violet-600 dark:text-violet-400">Updating…</span> : null}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full">
        <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="all">All topics</TabsTrigger>
          {UPDATES_TOPIC_IDS.map((id) => (
            <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
              {UPDATES_TOPIC_LABELS[id]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-xs text-muted-foreground mb-4">
        {tab === "all"
          ? "Blend of marketing strategy, actionable how-tos, digital and SEO depth, industry headlines, and Ascendra’s own posts and verified notes."
          : UPDATES_TOPIC_SOURCE_NOTES[tab]}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading feed" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">We couldn&apos;t load the feed right now. Please try again later.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden />
            <p className="text-muted-foreground">No items for this topic yet. Try another tab or check back shortly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
        <p>
          External articles link to third-party publishers; Ascendra does not control their content. Verified notes are
          written and reviewed in-house before they appear here.
        </p>
        {data?.generatedAt ? (
          <p>Last refreshed: {format(new Date(data.generatedAt), "PPpp")}.</p>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
