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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { AosExecutionRole } from "@shared/schema";

type AdminMin = { id: number; username: string; email: string | null };

export default function AgencyOsRolesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [checkedRoleIds, setCheckedRoleIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/execution-roles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/execution-roles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ roles: AosExecutionRole[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: mappingData, isLoading: mapLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/execution-roles/users", selectedUserId],
    queryFn: async () => {
      const url = new URL("/api/admin/agency-os/execution-roles/users", window.location.origin);
      if (selectedUserId) url.searchParams.set("userId", selectedUserId);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ admins: AdminMin[]; userId?: number; roleIds: number[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    if (!mappingData?.roleIds) return;
    const next: Record<number, boolean> = {};
    for (const id of mappingData.roleIds) next[id] = true;
    setCheckedRoleIds(next);
  }, [mappingData?.userId, mappingData?.roleIds]);

  useEffect(() => {
    if (mappingData?.admins?.length && !selectedUserId) {
      setSelectedUserId(String(mappingData.admins[0].id));
    }
  }, [mappingData?.admins, selectedUserId]);

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/agency-os/execution-roles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: key.trim(),
          label: label.trim(),
          responsibilities: [],
          taskTypes: [],
          systemsUsed: [],
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/execution-roles"] });
      setCreateOpen(false);
      setKey("");
      setLabel("");
      toast({ title: "Role created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: async (row: AosExecutionRole) => {
      const res = await fetch(`/api/admin/agency-os/execution-roles/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/execution-roles"] });
      toast({ title: "Deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveMapping = useMutation({
    mutationFn: async () => {
      const uid = Number.parseInt(selectedUserId, 10);
      if (!Number.isFinite(uid)) throw new Error("Pick an admin user.");
      const roleIds = Object.entries(checkedRoleIds)
        .filter(([, on]) => on)
        .map(([id]) => Number.parseInt(id, 10));
      const res = await fetch("/api/admin/agency-os/execution-roles/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, roleIds }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/execution-roles/users"] });
      toast({ title: "Roles saved for user" });
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

  const roles = rolesData?.roles ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Execution roles</h1>
        <p className="text-sm text-muted-foreground mt-1">Built-ins seed on first load; map approved admins to roles for routing context.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Role catalog</CardTitle>
            <CardDescription>Custom roles only can be deleted.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add custom role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom execution role</DialogTitle>
                <DialogDescription>Lowercase key, unique across the org.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Key</Label>
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rolesLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!rolesLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead />
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.key}</TableCell>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell>{r.isBuiltIn ? <Badge variant="secondary">Built-in</Badge> : null}</TableCell>
                    <TableCell>
                      {!r.isBuiltIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => delMut.mutate(r)}
                          disabled={delMut.isPending}
                          aria-label={`Delete ${r.label}`}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin ↔ roles</CardTitle>
          <CardDescription>Checked roles persist per user (approved admins only listed).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mapLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          {!mapLoading && mappingData && mappingData.admins.length > 0 ? (
            <>
              <div className="space-y-1 max-w-xs">
                <Label>Admin user</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {mappingData.admins.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.username} #{a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={!!checkedRoleIds[r.id]}
                      onCheckedChange={(c) =>
                        setCheckedRoleIds((prev) => ({ ...prev, [r.id]: c === true }))
                      }
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <Button onClick={() => saveMapping.mutate()} disabled={saveMapping.isPending}>
                Save mapping
              </Button>
            </>
          ) : !mapLoading ? (
            <p className="text-sm text-muted-foreground">No approved admins found.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
