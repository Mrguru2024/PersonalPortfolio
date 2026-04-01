"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, AlertTriangle } from "lucide-react";
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
import type { AosHvdRegistryRow } from "@shared/schema";

export default function AgencyOsHvdPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AosHvdRegistryRow | null>(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultOutcomeHints, setDefaultOutcomeHints] = useState("");
  const [sortOrder, setSortOrder] = useState("100");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/agency-os/hvd"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/hvd", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ entries: AosHvdRegistryRow[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const resetForm = () => {
    setSlug("");
    setName("");
    setDescription("");
    setDefaultOutcomeHints("");
    setSortOrder("100");
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agency-os/hvd", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || null,
          defaultOutcomeHints: defaultOutcomeHints.trim() || null,
          sortOrder: Number.parseInt(sortOrder, 10) || 100,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };
      if (!res.ok) throw new Error(j.error ?? `Save failed (${res.status})`);
      return j as { warning?: string };
    },
    onSuccess: (j) => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/hvd"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "HVD entry created", description: j.warning ?? "Saved to registry." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: async () => {
      if (!editRow) throw new Error("No row");
      const res = await fetch(`/api/admin/agency-os/hvd/${editRow.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          defaultOutcomeHints: defaultOutcomeHints.trim() || null,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? `Update failed (${res.status})`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/hvd"] });
      setEditRow(null);
      resetForm();
      toast({ title: "Updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/agency-os/hvd/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? `Delete failed (${res.status})`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/hvd"] });
      toast({ title: "Removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (row: AosHvdRegistryRow) => {
    setEditRow(row);
    setSlug(row.slug);
    setName(row.name);
    setDescription(row.description ?? "");
    setDefaultOutcomeHints(row.defaultOutcomeHints ?? "");
    setSortOrder(String(row.sortOrder ?? 0));
  };

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

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">High-Value Delivery (HVD) registry</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Built-in categories seed on first load. Custom slugs must be lowercase with underscores. New{" "}
            <Link href="/admin/agency-os/tasks" className="text-primary underline">
              projects and tasks
            </Link>{" "}
            reject unknown HVD slugs until you add them here.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Add custom HVD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New HVD entry</DialogTitle>
              <DialogDescription>
                Slug is permanent; use a short snake_case key. Validation runs on project/task create.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="aos-slug">Slug</Label>
                <Input
                  id="aos-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="e.g. client_onboarding_ops"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aos-name">Name</Label>
                <Input id="aos-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aos-desc">Description</Label>
                <Textarea id="aos-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aos-hints">Default outcome / metric hints</Label>
                <Textarea
                  id="aos-hints"
                  value={defaultOutcomeHints}
                  onChange={(e) => setDefaultOutcomeHints(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aos-sort">Sort order</Label>
                <Input id="aos-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !slug.trim() || !name.trim()}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registry</CardTitle>
          <CardDescription>
            Low-value or overlapping slugs surface a warning on create (not a hard block except duplicate slug).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-sm text-destructive">Could not load registry.</p>}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                    <TableCell className="text-sm">{row.name}</TableCell>
                    <TableCell>
                      {row.isBuiltIn ? (
                        <Badge variant="secondary">Built-in</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!row.isBuiltIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Delete HVD "${row.slug}"? Projects using it may fail validation.`)) {
                              deleteMut.mutate(row.id);
                            }
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editRow != null}
        onOpenChange={(o) => {
          if (!o) {
            setEditRow(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit HVD — {editRow?.slug}</DialogTitle>
            <DialogDescription>
              {editRow?.isBuiltIn ? "Built-in slugs cannot be renamed or deleted." : "Update labels and guidance."}
            </DialogDescription>
          </DialogHeader>
          {editRow && (
            <div className="space-y-3 py-2">
              {!editRow.isBuiltIn && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  Changing meaning of a custom slug may break existing projects that reference it.
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Default outcome / metric hints</Label>
                <Textarea
                  value={defaultOutcomeHints}
                  onChange={(e) => setDefaultOutcomeHints(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button onClick={() => patchMut.mutate()} disabled={patchMut.isPending || !name.trim()}>
              {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
