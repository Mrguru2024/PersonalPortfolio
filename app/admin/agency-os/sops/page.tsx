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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AosExecutionRole, AosSop } from "@shared/schema";

export default function AgencyOsSopsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [primaryHvd, setPrimaryHvd] = useState("");
  const [execRoleId, setExecRoleId] = useState<string>("none");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data: sopsData, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/sops"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/sops", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ sops: AosSop[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["/api/admin/agency-os/execution-roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/execution-roles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ roles: AosExecutionRole[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agency-os/sops", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          purpose: purpose.trim(),
          primaryHvdSlug: primaryHvd.trim() || null,
          executionRoleId: execRoleId === "none" ? null : Number.parseInt(execRoleId, 10),
          status: "draft",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/sops"] });
      setOpen(false);
      setTitle("");
      setPurpose("");
      setPrimaryHvd("");
      setExecRoleId("none");
      toast({ title: "SOP created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/agency-os/sops/${id}`, { method: "DELETE", credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/sops"] });
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

  const sops = sopsData?.sops ?? [];
  const roles = rolesData?.roles ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Standard operating procedures</h1>
          <p className="text-sm text-muted-foreground mt-1">Link steps and QA to execution roles and HVD.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">New SOP</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create SOP</DialogTitle>
              <DialogDescription>Publish workflow after you add steps (API or future editor).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Purpose</Label>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Primary HVD slug (optional)</Label>
                <Input
                  value={primaryHvd}
                  onChange={(e) => setPrimaryHvd(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Execution role (optional)</Label>
                <Select value={execRoleId} onValueChange={setExecRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.label} ({r.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                Save draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All SOPs</CardTitle>
          <CardDescription>Edit detail via API PATCH for now; list + quick create here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && sops.length === 0 && <p className="text-sm text-muted-foreground">No SOPs yet.</p>}
          {!isLoading && sops.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HVD</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sops.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.primaryHvdSlug ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => delMut.mutate(s.id)}
                        disabled={delMut.isPending}
                        aria-label={`Delete ${s.title}`}
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
