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
import type { AosPlaybook } from "@shared/schema";

export default function AgencyOsPlaybooksPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [primaryHvd, setPrimaryHvd] = useState("");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/playbooks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/playbooks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ playbooks: AosPlaybook[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agency-os/playbooks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          purpose: purpose.trim() || null,
          primaryHvdSlug: primaryHvd.trim() || null,
          steps: [],
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/playbooks"] });
      setOpen(false);
      setSlug("");
      setTitle("");
      setPurpose("");
      setPrimaryHvd("");
      toast({ title: "Playbook created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: async (row: AosPlaybook) => {
      if (row.isBuiltIn) throw new Error("Built-in playbooks cannot be deleted.");
      const res = await fetch(`/api/admin/agency-os/playbooks/${row.id}`, { method: "DELETE", credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/playbooks"] });
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

  const playbooks = data?.playbooks ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Playbooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Reusable step sequences; tie tasks to playbook IDs in the API.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">New playbook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create playbook</DialogTitle>
              <DialogDescription>Slug uses the same format as HVD keys (lowercase_snake).</DialogDescription>
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
                <Label>Purpose (optional)</Label>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Primary HVD (optional)</Label>
                <Input
                  value={primaryHvd}
                  onChange={(e) => setPrimaryHvd(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
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
          <CardTitle className="text-base">Catalog</CardTitle>
          <CardDescription>Add ordered steps with PATCH when you flesh out delivery.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && playbooks.length === 0 && <p className="text-sm text-muted-foreground">No playbooks.</p>}
          {!isLoading && playbooks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slug</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead />
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {playbooks.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>
                      {p.isBuiltIn ? <Badge variant="secondary">Built-in</Badge> : null}
                    </TableCell>
                    <TableCell>
                      {!p.isBuiltIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => delMut.mutate(p)}
                          disabled={delMut.isPending}
                          aria-label={`Delete ${p.title}`}
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
    </div>
  );
}
