"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TestTube2, ArrowLeft } from "lucide-react";
import { type MarketResearchSourceKey } from "@shared/marketResearchConstants";

type SourceConfigsResponse = {
  sourceConfigs: Array<{
    sourceKey: string;
    enabled: boolean;
    fallbackEnabled: boolean;
    setupStatus: string;
    setupSteps: string[];
    requirements: string[];
    supportsConnectionTest: boolean;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
  }>;
};

export default function MarketResearchSetupPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sourceConfigsQuery = useQuery<SourceConfigsResponse>({
    queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
    queryFn: async () => {
      const response = await fetch(
        "/api/admin/growth-os/market-research/source-configs?projectKey=ascendra_main",
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to load source setup");
      return response.json();
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async (payload: {
      sourceKey: MarketResearchSourceKey;
      enabled?: boolean;
      fallbackEnabled?: boolean;
    }) => {
      const response = await apiRequest("PATCH", "/api/admin/growth-os/market-research/source-configs", {
        sourceKey: payload.sourceKey,
        enabled: payload.enabled,
        fallbackEnabled: payload.fallbackEnabled,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
      });
      toast({ title: "Source updated" });
    },
    onError: (error: Error) =>
      toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const testSourceMutation = useMutation({
    mutationFn: async (sourceKey: MarketResearchSourceKey) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/growth-os/market-research/source-configs/${sourceKey}/test`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
      });
      toast({ title: "Connection test complete" });
    },
    onError: (error: Error) =>
      toast({ title: "Test failed", description: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link href="/admin/growth-os/market-research">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to research engine
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Source setup</h1>
        <p className="text-sm text-muted-foreground">
          Configure each source status, fallback behavior, and run connection checks.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Market research sources</CardTitle>
              <CardDescription>Live integrations are optional; fallback/manual flow is supported.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/growth-os/market-research/source-configs", "ascendra_main"],
                })
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sourceConfigsQuery.isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading setup...
            </div>
          ) : (
            <div className="space-y-3">
              {(sourceConfigsQuery.data?.sourceConfigs ?? []).map((source) => {
                const sourceKey = source.sourceKey as MarketResearchSourceKey;
                return (
                  <div key={source.sourceKey} className="rounded-md border border-border/70 p-3 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{source.sourceKey}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{source.setupStatus}</Badge>
                          <Badge variant={source.enabled ? "default" : "secondary"}>
                            {source.enabled ? "enabled" : "disabled"}
                          </Badge>
                          <Badge variant="secondary">
                            fallback {source.fallbackEnabled ? "on" : "off"}
                          </Badge>
                          {source.lastTestStatus ? <Badge variant="outline">{source.lastTestStatus}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={source.enabled ? "secondary" : "outline"}
                          onClick={() =>
                            updateSourceMutation.mutate({ sourceKey, enabled: !source.enabled })
                          }
                          disabled={updateSourceMutation.isPending}
                        >
                          {source.enabled ? "Enabled" : "Disabled"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateSourceMutation.mutate({
                              sourceKey,
                              fallbackEnabled: !source.fallbackEnabled,
                            })
                          }
                          disabled={updateSourceMutation.isPending}
                        >
                          Toggle fallback
                        </Button>
                        {source.supportsConnectionTest ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testSourceMutation.mutate(sourceKey)}
                            disabled={testSourceMutation.isPending}
                          >
                            <TestTube2 className="h-4 w-4 mr-1" />
                            Test connection
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {source.lastTestMessage ? (
                      <p className="text-xs text-muted-foreground">{source.lastTestMessage}</p>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          Requirements
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {source.requirements.map((item, idx) => (
                            <li key={`${source.sourceKey}-requirement-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          Setup steps
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {source.setupSteps.map((item, idx) => (
                            <li key={`${source.sourceKey}-step-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
