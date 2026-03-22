"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Search, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { buildManualSocialSearchLinks } from "@/lib/social-profile-discovery";

export interface SocialSuggestionRow {
  id: number;
  contactId: number;
  platform: string;
  profileUrl: string;
  displayName: string | null;
  snippet: string | null;
  confidence: number | null;
  matchReason: string | null;
  discoverySource: string;
  status: string;
  createdAt: string;
}

export interface SocialProfileDiscoveryCardProps {
  contactId: number;
  contactName: string;
  company?: string | null;
  jobTitle?: string | null;
  onUpdated: () => void;
}

export function SocialProfileDiscoveryCard({
  contactId,
  contactName,
  company,
  jobTitle,
  onUpdated,
}: SocialProfileDiscoveryCardProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const manualSearchLinks = useMemo(
    () => buildManualSocialSearchLinks({ name: contactName, company, jobTitle }),
    [contactName, company, jobTitle]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/crm/contacts", contactId, "social-suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${contactId}/social-suggestions`);
      if (!res.ok) throw new Error("fail");
      return res.json() as Promise<{ suggestions: SocialSuggestionRow[] }>;
    },
    enabled: !!contactId,
  });

  const discoverMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/contacts/${contactId}/social-discovery`, {});
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Discovery failed");
      return j as {
        usedBrave: boolean;
        usedOpenAI: boolean;
        manualSearchLinks: { label: string; url: string }[];
        suggestions: SocialSuggestionRow[];
      };
    },
    onSuccess: (j) => {
      toast({
        title: "Discovery complete",
        description: `${j.suggestions?.length ?? 0} suggestion(s) · Brave: ${j.usedBrave ? "on" : "off"} · OpenAI rank: ${j.usedOpenAI ? "on" : "off"}`,
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "social-suggestions"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "timeline"] });
      onUpdated();
    },
    onError: (e: Error) => toast({ title: "Discovery failed", description: e.message, variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: async ({ suggestionId, action }: { suggestionId: number; action: "apply" | "dismiss" }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/crm/contacts/${contactId}/social-suggestions/${suggestionId}`,
        { action }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || "Update failed");
      return j;
    },
    onSuccess: (_, v) => {
      toast({ title: v.action === "apply" ? "Profile linked" : "Suggestion dismissed" });
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "social-suggestions"] });
      onUpdated();
    },
    onError: (e: Error) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const suggestions = data?.suggestions ?? [];
  const active = suggestions.filter((s) => s.status === "suggested");

  return (
    <Card className="border-muted">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social profile discovery
            </CardTitle>
            <CardDescription>
              Searches the public web (Brave Search API) for profile URLs matching this lead&apos;s name and company. Results
              are suggestions only — verify each link before applying. Optional OpenAI re-ranking uses the same candidates;
              it does not invent URLs.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => discoverMut.mutate()}
            disabled={discoverMut.isPending}
            aria-label="Discover social profiles"
          >
            {discoverMut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : <Search className="h-4 w-4 mr-2" />}
            Discover
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2">
          Configure <code className="text-xs">BRAVE_SEARCH_API_KEY</code> on the server for automated search.{" "}
          <code className="text-xs">OPENAI_API_KEY</code> enables confidence refinement only.
        </p>

        {isLoading ?
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        : active.length === 0 ?
          <p className="text-muted-foreground">
            No open suggestions. Run Discover to pull public results and propose LinkedIn, X, GitHub, and other profiles.
          </p>
        : (
          <ul className="space-y-3">
            {active.map((s) => (
              <li key={s.id} className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{s.platform}</Badge>
                  {s.confidence != null && <span className="text-xs text-muted-foreground">~{s.confidence}% match</span>}
                  <Badge variant="secondary" className="text-xs">
                    {s.discoverySource.replace(/_/g, " ")}
                  </Badge>
                </div>
                <a
                  href={s.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  {s.displayName || s.profileUrl}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {s.snippet && <p className="text-xs text-muted-foreground line-clamp-3">{s.snippet}</p>}
                {s.matchReason && <p className="text-xs text-muted-foreground">{s.matchReason}</p>}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={patchMut.isPending}
                    onClick={() => patchMut.mutate({ suggestionId: s.id, action: "apply" })}
                  >
                    Apply to CRM
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={patchMut.isPending}
                    onClick={() => patchMut.mutate({ suggestionId: s.id, action: "dismiss" })}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Manual search (always available)</p>
          <ul className="flex flex-wrap gap-2">
            {manualSearchLinks.map((l) => (
              <li key={l.url}>
                <Button variant="outline" size="sm" asChild>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
