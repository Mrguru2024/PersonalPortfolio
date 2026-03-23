"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink,
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
  type SiteDirectoryAudience,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type AudienceFilter = "all" | SiteDirectoryAudience;

const AUDIENCE_LABEL: Record<SiteDirectoryAudience, string> = {
  public: "Website visitors",
  admin: "Admin / staff only",
  client: "Client portal",
  token: "Shared link (no login)",
};

function isStaticPath(path: string): boolean {
  return !path.includes("[");
}

function humanizeCluster(id: string): string {
  return id
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function AdminSiteDirectoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [clientReady, setClientReady] = useState(false);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [groupedTopicsOpen, setGroupedTopicsOpen] = useState(false);

  useEffect(() => setClientReady(true), []);

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
      toast({ title: "Copied", description: "Full directory data is on the clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission denied.", variant: "destructive" });
    }
  }

  if (!clientReady || authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-busy="true"
        aria-label="Loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapIcon className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pages &amp; tools directory</h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-3xl leading-relaxed">
              Find every page on the site by name or topic. See who can open it (visitors, clients, or staff), then
              jump straight there. Use this when you need to remember where something lives—no technical background
              required.
            </p>
          </div>
        </div>

        <Card className="mb-6 border-primary/15 bg-primary/[0.03] dark:bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Quick tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2 pt-0">
            <p>Type a word you remember—like <span className="text-foreground font-medium">blog</span>,{" "}
              <span className="text-foreground font-medium">invoice</span>, or{" "}
              <span className="text-foreground font-medium">contact</span>—to narrow the list.</p>
            <p>
              Use <span className="text-foreground font-medium">Who can see this</span> to show only visitor-facing
              pages, only admin screens, or client areas.
            </p>
            <p>
              Pages whose address contains <code className="text-xs bg-muted px-1 py-0.5 rounded">[id]</code> are
              templates (you open them from elsewhere in the app); there is no single “Open” button for those.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search</CardTitle>
            <CardDescription>
              Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
              {SITE_DIRECTORY_ENTRIES_UNIQUE.length} pages
              {query ? ` matching “${query}”` : ""}. Use quotes for an exact phrase (e.g.{" "}
              <code className="text-xs bg-muted px-1 rounded">&quot;lead intake&quot;</code>{" "}
              <code className="text-xs bg-muted px-1 rounded">crm</code>) — results rank by title, path, and keywords.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                className="pl-9 h-11"
                placeholder='Search: words + optional phrases — e.g. admin "content studio"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search pages and tools"
              />
            </div>
            <Select value={audience} onValueChange={(v) => setAudience(v as AudienceFilter)}>
              <SelectTrigger className="w-full sm:w-[240px] h-11" aria-label="Who can see this page">
                <SelectValue placeholder="Who can see this" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pages</SelectItem>
                <SelectItem value="public">Website visitors</SelectItem>
                <SelectItem value="admin">Admin / staff only</SelectItem>
                <SelectItem value="client">Client portal</SelectItem>
                <SelectItem value="token">Shared links (magic links)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Collapsible open={groupedTopicsOpen} onOpenChange={setGroupedTopicsOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left p-6 hover:bg-muted/30 rounded-lg transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-base flex items-center gap-2">
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${groupedTopicsOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                    Pages grouped by similar topic
                  </span>
                  <p className="text-sm text-muted-foreground mt-1 font-normal">
                    Optional: see pages we have flagged as related (useful for planning links or avoiding duplicate
                    content). Expand to view.
                  </p>
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 pb-6 px-6 border-t border-border/60">
                {[...clusterMap.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([cluster, items]) => (
                    <div key={cluster} className="border-b border-border/60 last:border-0 pb-4 last:pb-0">
                      <p className="text-sm font-semibold text-foreground mb-2">{humanizeCluster(cluster)}</p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {items.map((e) => (
                          <li key={e.path} className="rounded-md bg-muted/30 px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{e.title}</span>
                              <span className="text-xs font-mono text-muted-foreground">{e.path}</span>
                            </div>
                            {e.consolidateNote ? (
                              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1.5">{e.consolidateNote}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={technicalOpen} onOpenChange={setTechnicalOpen} className="mb-8">
          <Card className="border-dashed">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 p-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${technicalOpen ? "rotate-180" : ""}`} />
                Technical export (developers &amp; AI tools)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 px-4 space-y-3 text-sm text-muted-foreground border-t border-border/60">
                <p>
                  Copy a machine-readable list of every route for documentation or AI assistants. API access:{" "}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">GET /api/admin/site-directory</code>
                  {", "}
                  optional search:{" "}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">?q=crm</code>.
                </p>
                <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={copyJsonForAgents}>
                  <Copy className="h-4 w-4" />
                  Copy full directory as JSON
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="space-y-10">
          {byCategory.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No pages match your search. Try different words or clear the filters.</p>
          ) : null}
          {byCategory.map(([category, items]) => (
            <section key={category} aria-labelledby={`cat-${category.replace(/\s+/g, "-")}`}>
              <h2
                id={`cat-${category.replace(/\s+/g, "-")}`}
                className="text-lg font-semibold mb-4 pb-2 border-b border-border/80"
              >
                {category}
              </h2>
              <ul className="space-y-4">
                {items.map((e: SiteDirectoryEntry) => {
                  const openable = isStaticPath(e.path);
                  const isPublic = e.audience === "public";
                  return (
                    <li
                      key={e.path}
                      className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm/50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground leading-snug">{e.title}</h3>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {AUDIENCE_LABEL[e.audience]}
                            </Badge>
                            {e.cluster ? (
                              <Badge variant="outline" className="text-xs font-normal">
                                Topic: {humanizeCluster(e.cluster)}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{e.description}</p>
                          <p className="text-xs font-mono text-muted-foreground/90 break-all">
                            <span className="text-muted-foreground font-sans not-italic mr-1.5">Address:</span>
                            {e.path}
                          </p>
                          {e.relatedPaths?.length ? (
                            <div className="text-xs text-muted-foreground pt-1">
                              <span className="font-medium text-foreground/80">Related:</span>{" "}
                              {e.relatedPaths.map((p: string, i: number) => (
                                <span key={p}>
                                  {i > 0 ? " · " : ""}
                                  {isStaticPath(p) ? (
                                    <Link
                                      href={p}
                                      className="text-primary underline-offset-2 hover:underline font-mono text-[11px]"
                                    >
                                      {p}
                                    </Link>
                                  ) : (
                                    <span className="font-mono text-[11px]">{p}</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 flex flex-col gap-2 sm:items-end">
                          {openable ? (
                            <Button variant="default" size="sm" className="gap-1.5 w-full sm:w-auto" asChild>
                              <Link
                                href={e.path}
                                {...(isPublic ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                              >
                                {isPublic ? (
                                  <>
                                    Open page
                                    <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                                  </>
                                ) : (
                                  "Open in admin"
                                )}
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground text-center sm:text-right max-w-[200px]">
                              Open this screen from its list or menu inside the app (address uses a variable slot).
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
