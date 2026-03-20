"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { Loader2, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { INTERNAL_CMS_CONTENT_TYPES, WORKFLOW_STATUSES } from "@/lib/content-studio/constants";
import { useRouter } from "next/navigation";

interface DocRow {
  id: number;
  title: string;
  contentType: string;
  workflowStatus: string;
  visibility: string;
  updatedAt: string;
}

export default function ContentStudioDocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState<string>("all");
  const [contentType, setContentType] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/content-studio/documents", search, workflowStatus, contentType],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (workflowStatus !== "all") q.set("workflowStatus", workflowStatus);
      if (contentType !== "all") q.set("contentType", contentType);
      const res = await fetch(`/api/admin/content-studio/documents?${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ documents: DocRow[] }>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/content-studio/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "blog_draft",
          title: `New draft ${new Date().toLocaleString()}`,
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
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
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
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border/60">
              {(data?.documents ?? []).map((d) => (
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
