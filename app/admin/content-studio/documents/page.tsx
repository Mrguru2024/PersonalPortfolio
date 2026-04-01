"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { INTERNAL_CMS_CONTENT_TYPES, WORKFLOW_STATUSES } from "@/lib/content-studio/constants";
import { useRouter } from "next/navigation";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 350;

interface DocRow {
  id: number;
  title: string;
  contentType: string;
  workflowStatus: string;
  visibility: string;
  updatedAt: string;
}

interface DocumentsApiResponse {
  documents: DocRow[];
  total: number;
  limit: number;
  offset: number;
}

export default function ContentStudioDocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(0);
  const [workflowStatus, setWorkflowStatus] = useState<string>("all");
  const [contentType, setContentType] = useState<string>("all");

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, workflowStatus, contentType]);

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: [
      "/api/admin/content-studio/documents",
      workflowStatus,
      contentType,
      debouncedSearch,
      page,
      PAGE_SIZE,
    ],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("limit", String(PAGE_SIZE));
      q.set("offset", String(page * PAGE_SIZE));
      if (debouncedSearch.trim()) q.set("search", debouncedSearch.trim());
      if (workflowStatus !== "all") q.set("workflowStatus", workflowStatus);
      if (contentType !== "all") q.set("contentType", contentType);
      const res = await fetch(`/api/admin/content-studio/documents?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<DocumentsApiResponse>;
    },
    placeholderData: keepPreviousData,
  });

  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (total === 0) return;
    const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [total, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, total);

  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const paginationSummary = useMemo(() => {
    if (total === 0) return "No documents";
    return `Showing ${rangeStart}–${rangeEnd} of ${total}`;
  }, [total, rangeStart, rangeEnd]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/content-studio/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "blog_draft",
          title: `New draft ${formatLocaleMediumDateTime(Date.now())}`,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json() as Promise<{ document: { id: number } }>;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/documents"] });
      router.push(`/admin/content-studio/documents/${d.document.id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Content library</CardTitle>
            <CardDescription>Hooks, headlines, drafts, captions — all internal until promoted.</CardDescription>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            New document
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search title, excerpt, type, status, visibility…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search documents"
              />
            </div>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {INTERNAL_CMS_CONTENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={workflowStatus} onValueChange={setWorkflowStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {WORKFLOW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {paginationSummary}
              {search !== debouncedSearch && search.trim() ? " · updating search…" : null}
            </span>
            {total > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!canPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums px-2 text-xs sm:text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!canNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isLoading && !data ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : total === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No documents match your filters.</p>
          ) : (
            <ul
              className={`divide-y divide-border rounded-lg border border-border/60 ${isFetching && isPlaceholderData ? "opacity-70" : ""}`}
            >
              {documents.map((d) => (
                <li key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                      <span>{d.contentType}</span>
                      <Badge variant="outline">{d.workflowStatus}</Badge>
                      <Badge variant="secondary">{d.visibility}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/content-studio/documents/${d.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
