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
import { SCRIPT_TEMPLATE_CATEGORIES, SCRIPT_CATEGORY_LABELS } from "@shared/schema";

interface Script {
  id: number;
  personaId: string;
  category: string;
  name: string;
  bodyMd: string;
  status: string;
}

interface PersonaOpt {
  id: string;
  displayName: string;
}

export default function EditAscendraScriptPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam ?? "";
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [personaId, setPersonaId] = useState("");
  const [category, setCategory] = useState("warm");
  const [name, setName] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: personasData } = useQuery<{ personas: PersonaOpt[] }>({
    queryKey: ["/api/admin/ascendra-intelligence/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/personas");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data, isLoading } = useQuery<{ script: Script }>({
    queryKey: ["/api/admin/ascendra-intelligence/scripts", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ascendra-intelligence/scripts/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  const script = data?.script;

  useEffect(() => {
    if (!script) return;
    setPersonaId(script.personaId);
    setCategory(script.category);
    setName(script.name);
    setBodyMd(script.bodyMd);
    setStatus(script.status);
  }, [script]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/ascendra-intelligence/scripts/${id}`, {
        personaId,
        category,
        name,
        bodyMd,
        status,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/scripts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/scripts", id] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/ascendra-intelligence/scripts/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/scripts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/summary"] });
      toast({ title: "Deleted" });
      router.push("/admin/ascendra-intelligence/scripts");
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

  if (!script) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        Not found.
        <Button asChild variant="link" className="block mx-auto mt-4">
          <Link href="/admin/ascendra-intelligence/scripts">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/ascendra-intelligence/scripts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Scripts
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
                <AlertDialogTitle>Delete script?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
            <CardTitle>Edit script</CardTitle>
            <CardDescription>#{script.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(personasData?.personas ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCRIPT_TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SCRIPT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" rows={14} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} />
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
            <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
