"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AosTrainingModule } from "@shared/schema";

const DEFAULT_JSON = `{
  "overview": "What this module covers.",
  "steps": ["Read SOP", "Shadow one run", "Solo with QA"]
}`;

export default function AgencyOsTrainingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentJson, setContentJson] = useState(DEFAULT_JSON);
  const [filterRoleKey, setFilterRoleKey] = useState("");
  const [filterHvd, setFilterHvd] = useState("");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/training-modules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/training-modules", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ modules: AosTrainingModule[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(contentJson) as Record<string, unknown>;
      } catch {
        throw new Error("contentJson must be valid JSON.");
      }
      const res = await fetch("/api/admin/agency-os/training-modules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          summary: summary.trim() || null,
          contentJson: parsed,
          filterRoleKey: filterRoleKey.trim() || null,
          filterHvdSlug: filterHvd.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/training-modules"] });
      setOpen(false);
      setSlug("");
      setTitle("");
      setSummary("");
      setContentJson(DEFAULT_JSON);
      setFilterRoleKey("");
      setFilterHvd("");
      toast({ title: "Training module created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/agency-os/training-modules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/training-modules"] });
      toast({ title: "Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  const modules = data?.modules ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Training modules</h1>
          <p className="text-sm text-muted-foreground mt-1">Structured content JSON; filter by role key or HVD slug when set.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">New module</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create training module</DialogTitle>
              <DialogDescription>Slug format matches HVD keys (registry slug for consistency).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Summary</Label>
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Content JSON</Label>
                <Textarea
                  value={contentJson}
                  onChange={(e) => setContentJson(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>Filter: role key (optional)</Label>
                <Input value={filterRoleKey} onChange={(e) => setFilterRoleKey(e.target.value)} className="font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Filter: HVD slug (optional)</Label>
                <Input
                  value={filterHvd}
                  onChange={(e) => setFilterHvd(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modules</CardTitle>
          <CardDescription>Publish toggles and edits available via API.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && modules.length === 0 && <p className="text-sm text-muted-foreground">No modules.</p>}
          {!isLoading && modules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.slug}</TableCell>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>
                      <Badge variant={m.isPublished ? "default" : "secondary"}>
                        {m.isPublished ? "yes" : "no"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => delMut.mutate(m.id)}
                        disabled={delMut.isPending}
                        aria-label={`Delete ${m.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
