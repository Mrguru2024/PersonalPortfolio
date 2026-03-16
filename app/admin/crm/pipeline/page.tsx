"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Target,
  Building2,
  User,
  Filter,
  ArrowUpDown,
  ChevronRight,
  MoreHorizontal,
  X,
  DollarSign,
  Calendar,
  Zap,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPipelineStageLabel } from "@/lib/crm-pipeline-stages";
import { CRM_PIPELINE_STAGES } from "@/lib/crm-pipeline-stages";
import { format } from "date-fns";

interface DealWithContact {
  id: number;
  title: string;
  value: number;
  pipelineStage?: string | null;
  leadScore?: number | null;
  urgencyLevel?: string | null;
  source?: string | null;
  expectedCloseAt?: string | null;
  updatedAt?: string | null;
  contactId: number;
  contact?: { name: string; company?: string | null };
  account?: { name: string } | null;
}

export default function CrmPipelinePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (sortBy) p.set("sortBy", sortBy);
    if (sortOrder) p.set("sortOrder", sortOrder);
    if (sourceFilter) p.set("source", sourceFilter);
    if (urgencyFilter) p.set("urgencyLevel", urgencyFilter);
    return p.toString();
  }, [sortBy, sortOrder, sourceFilter, urgencyFilter]);

  const { data: deals = [], isLoading } = useQuery<DealWithContact[]>({
    queryKey: ["/api/admin/crm/deals", queryParams],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/deals?${queryParams}`);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: number; stage: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/deals/${dealId}`, { pipelineStage: stage });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Stage updated" });
    },
    onError: () => toast({ title: "Failed to update stage", variant: "destructive" }),
  });

  const uniqueSources = useMemo(() => {
    const set = new Set(deals.map((d) => d.source || "unknown").filter(Boolean));
    return Array.from(set).sort();
  }, [deals]);
  const uniqueUrgency = useMemo(() => {
    const set = new Set(deals.map((d) => d.urgencyLevel).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [deals]);

  const byStage = useMemo(
    () =>
      CRM_PIPELINE_STAGES.reduce(
        (acc, stage) => {
          acc[stage] = deals.filter((d) => (d.pipelineStage ?? "new_lead") === stage);
          return acc;
        },
        {} as Record<string, DealWithContact[]>
      ),
    [deals]
  );

  const stageTotalValue = (stage: string) =>
    (byStage[stage] ?? []).reduce((sum, d) => sum + (d.value ?? 0), 0);
  const hasActiveFilters = sourceFilter || urgencyFilter;

  const scrollToStage = (stage: string) => {
    const el = document.getElementById(`stage-${stage}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/crm">
                  <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                  CRM
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Pipeline</h1>
                <p className="text-xs text-muted-foreground">Move deals between stages</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/crm/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/crm">Contacts</Link>
              </Button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] h-9">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last updated</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="score">Lead score</SelectItem>
                  <SelectItem value="expectedCloseAt">Close date</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  {uniqueSources.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All urgency</SelectItem>
                  {uniqueUrgency.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setSourceFilter("");
                  setUrgencyFilter("");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Stage quick-jump */}
          <div className="flex flex-wrap items-center gap-1 mt-2 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground shrink-0 mr-1">Jump to:</span>
            {CRM_PIPELINE_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => scrollToStage(stage)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium bg-muted/70 hover:bg-muted text-foreground transition-colors"
              >
                {getPipelineStageLabel(stage)} ({(byStage[stage] ?? []).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 container max-w-[1600px] mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {CRM_PIPELINE_STAGES.map((stage) => (
              <div
                key={stage}
                className="min-w-[260px] w-[260px] shrink-0 rounded-lg border bg-card p-4"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
                <div className="h-4 w-full bg-muted/60 animate-pulse rounded mb-2" />
                <div className="h-4 w-full bg-muted/60 animate-pulse rounded mb-2" />
                <div className="h-20 bg-muted/40 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scroll-smooth"
            style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: "1rem" }}
          >
            {CRM_PIPELINE_STAGES.map((stage) => {
              const stageDeals = byStage[stage] ?? [];
              const totalValue = stageTotalValue(stage);
              return (
                <Card
                  key={stage}
                  id={`stage-${stage}`}
                  className="min-w-[280px] w-[280px] shrink-0 flex flex-col overflow-hidden"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          {getPipelineStageLabel(stage)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""}
                          {totalValue > 0 && (
                            <span className="ml-1">
                              · ${(totalValue / 100).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 px-4 pb-4 overflow-y-auto max-h-[calc(100vh-320px)] space-y-2">
                    {stageDeals.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                        <p className="text-xs text-muted-foreground">No deals in this stage</p>
                        <p className="text-xs text-muted-foreground mt-1">Move cards from other stages</p>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onMoveStage={(newStage) =>
                            updateStageMutation.mutate({ dealId: deal.id, stage: newStage })
                          }
                          isUpdating={updateStageMutation.isPending}
                          otherStages={CRM_PIPELINE_STAGES.filter((s) => s !== (deal.pipelineStage ?? "new_lead"))}
                          getStageLabel={getPipelineStageLabel}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onMoveStage,
  isUpdating,
  otherStages,
  getStageLabel,
}: {
  deal: DealWithContact;
  onMoveStage: (stage: string) => void;
  isUpdating: boolean;
  otherStages: string[];
  getStageLabel: (s: string) => string;
}) {
  const contactId = deal.contactId;
  const company = deal.account?.name ?? deal.contact?.company;

  return (
    <div className="group rounded-lg border bg-card p-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <Link
        href={`/admin/crm/${contactId}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        <p className="font-medium text-sm truncate pr-6">{deal.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
          <User className="h-3 w-3 shrink-0" />
          {deal.contact?.name ?? "—"}
        </p>
        {company && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            {company}
          </p>
        )}
      </Link>
      <div className="flex flex-wrap gap-1 mt-2">
        {deal.value > 0 && (
          <Badge variant="secondary" className="text-xs font-normal gap-0.5">
            <DollarSign className="h-3 w-3" />
            {(deal.value / 100).toLocaleString()}
          </Badge>
        )}
        {deal.leadScore != null && (
          <Badge variant="outline" className="text-xs font-normal gap-0.5">
            <Zap className="h-3 w-3" />
            {deal.leadScore}
          </Badge>
        )}
        {deal.expectedCloseAt && (
          <Badge variant="outline" className="text-xs font-normal gap-0.5">
            <Calendar className="h-3 w-3" />
            {format(new Date(deal.expectedCloseAt), "MMM d")}
          </Badge>
        )}
      </div>
      <div className="mt-2 pt-2 border-t flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MoreHorizontal className="h-3 w-3" />}
              Move to
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {otherStages.map((stage) => (
              <DropdownMenuItem
                key={stage}
                onClick={() => onMoveStage(stage)}
              >
                {getStageLabel(stage)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
