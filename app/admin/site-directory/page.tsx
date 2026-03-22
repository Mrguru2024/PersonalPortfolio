"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Loader2,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SITE_DIRECTORY_ENTRIES_UNIQUE,
  entriesByCluster,
  searchSiteDirectory,
  type SiteDirectoryEntry,
} from "@/lib/siteDirectory";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AudienceFilter = "all" | SiteDirectoryEntry["audience"];

export default function AdminSiteDirectoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const filtered = useMemo(() => {
    let list = searchSiteDirectory(query);
    if (audience !== "all") {
      list = list.filter((e) => e.audience === audience);
    }
    return list;
  }, [query, audience]);

  const byCategory = useMemo(() => {
    const m = new Map<string, SiteDirectoryEntry[]>();
    for (const e of filtered) {
      const list = m.get(e.category) ?? [];
      list.push(e);
      m.set(e.category, list);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const clusterMap = useMemo(() => entriesByCluster(), []);

  async function copyJsonForAgents() {
    const payload = {
      generatedAt: new Date().toISOString(),
      note: "Ascendra site route map — use paths relative to production origin.",
      entries: SITE_DIRECTORY_ENTRIES_UNIQUE,
      clusters: Object.fromEntries([...clusterMap.entries()].sort(([a], [b]) => a.localeCompare(b))),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", description: "Full directory JSON is on the clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <MapIcon className="h-10 w-10 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Site directory</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
              Search every public and admin route, see consolidation clusters, and copy JSON for AI assistants.
              API: <code className="text-xs bg-muted px-1 rounded">GET /api/admin/site-directory</code>
              (optional <code className="text-xs bg-muted px-1 rounded">?q=crm</code>).
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search & filters</CardTitle>
            <CardDescription>
              {filtered.length} of {SITE_DIRECTORY_ENTRIES_UNIQUE.length} routes
              {query ? ` matching “${query}”` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search path, title, keywords, cluster…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search routes"
              />
            </div>
            <Select value={audience} onValueChange={(v) => setAudience(v as AudienceFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All audiences</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="client">Client portal</SelectItem>
                <SelectItem value="token">Token / magic link</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={copyJsonForAgents}>
              <Copy className="h-4 w-4" />
              Copy JSON for AI
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Consolidation clusters</CardTitle>
            <CardDescription>
              Pages that share intent; candidates to merge, cross-link, or redirect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...clusterMap.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cluster, items]) => (
                <div key={cluster} className="border-b border-border/60 last:border-0 pb-4 last:pb-0">
                  <p className="text-sm font-semibold text-foreground mb-2">{cluster}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {items.map((e) => (
                      <li key={e.path}>
                        <code className="text-xs bg-muted px-1 rounded mr-1">{e.path}</code>
                        {e.title}
                        {e.consolidateNote ? (
                          <span className="block text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                            {e.consolidateNote}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {byCategory.map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg font-semibold mb-3">{category}</h2>
              <ul className="space-y-3">
                {items.map((e: SiteDirectoryEntry) => (
                  <li
                    key={e.path}
                    className="rounded-lg border border-border/80 bg-card/50 p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{e.path}</code>
                      <Badge variant="outline" className="text-xs capitalize">
                        {e.audience}
                      </Badge>
                      {e.cluster ? (
                        <Badge variant="secondary" className="text-xs">
                          {e.cluster}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="font-medium text-foreground">{e.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                    {e.relatedPaths?.length ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        Related:{" "}
                        {e.relatedPaths.map((p: string, i: number) => (
                          <span key={p}>
                            {i > 0 ? " · " : ""}
                            <code className="bg-muted px-1 rounded">{p}</code>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
