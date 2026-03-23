"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_MAGNET_TYPES, LEAD_MAGNET_TYPE_LABELS } from "@shared/schema";

interface Magnet {
  id: number;
  magnetType: string;
  title: string;
  hook: string | null;
  bodyMd: string | null;
  primaryAssetId: number | null;
  personaIds: string[];
  status: string;
}

export default function EditLeadMagnetPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ?? "";
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [magnetType, setMagnetType] = useState("reveal_problems");
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [primaryAssetId, setPrimaryAssetId] = useState("");
  const [personaIdsLine, setPersonaIdsLine] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ magnet: Magnet }>({
    queryKey: ["/api/admin/ascendra-intelligence/lead-magnets", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ascendra-intelligence/lead-magnets/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  const magnet = data?.magnet;

  useEffect(() => {
    if (!magnet) return;
    setMagnetType(magnet.magnetType);
    setTitle(magnet.title);
    setHook(magnet.hook ?? "");
    setBodyMd(magnet.bodyMd ?? "");
    setPrimaryAssetId(magnet.primaryAssetId != null ? String(magnet.primaryAssetId) : "");
    setPersonaIdsLine(magnet.personaIds?.join(", ") ?? "");
    setStatus(magnet.status);
  }, [magnet]);

  const save = useMutation({
    mutationFn: async () => {
      const personaIds = personaIdsLine
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const assetNum = primaryAssetId.trim() ? Number.parseInt(primaryAssetId, 10) : null;
      const res = await apiRequest("PATCH", `/api/admin/ascendra-intelligence/lead-magnets/${id}`, {
        magnetType,
        title,
        hook: hook || null,
        bodyMd: bodyMd || null,
        primaryAssetId: Number.isNaN(assetNum as number) ? null : assetNum,
        personaIds,
        status,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/lead-magnets"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/lead-magnets", id] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/ascendra-intelligence/lead-magnets/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/lead-magnets"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/summary"] });
      toast({ title: "Deleted" });
      router.push("/admin/ascendra-intelligence/lead-magnets");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!magnet) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        Not found.
        <Button asChild variant="link" className="block mx-auto mt-4">
          <Link href="/admin/ascendra-intelligence/lead-magnets">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/ascendra-intelligence/lead-magnets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Lead magnets
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" type="button">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete lead magnet?</AlertDialogTitle>
                <AlertDialogDescription>Cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => del.mutate()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit lead magnet</CardTitle>
            <CardDescription>#{magnet.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={magnetType} onValueChange={setMagnetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_MAGNET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LEAD_MAGNET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hook">Hook</Label>
              <Input id="hook" value={hook} onChange={(e) => setHook(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" rows={10} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset">Primary funnel asset ID</Label>
              <Input id="asset" value={primaryAssetId} onChange={(e) => setPrimaryAssetId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pids">Persona IDs</Label>
              <Input id="pids" value={personaIdsLine} onChange={(e) => setPersonaIdsLine(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="approved">approved</SelectItem>
                  <SelectItem value="published">published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !title.trim()}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
