"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["warm", "cold", "content", "follow_up", "objection"] as const;

interface PersonaOpt {
  id: string;
  displayName: string;
}

export default function NewAscendraScriptPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [personaId, setPersonaId] = useState("");
  const [category, setCategory] = useState<string>("warm");
  const [name, setName] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: personasData, isLoading: loadingPersonas } = useQuery<{ personas: PersonaOpt[] }>({
    queryKey: ["/api/admin/ascendra-intelligence/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/personas");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    const first = personasData?.personas?.[0]?.id;
    if (first && !personaId) setPersonaId(first);
  }, [personasData, personaId]);

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/scripts", {
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
      return res.json() as Promise<{ script: { id: number } }>;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/scripts"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/summary"] });
      toast({ title: "Created" });
      router.push(`/admin/ascendra-intelligence/scripts/${d.script.id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ascendra-intelligence/scripts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Scripts
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>New script template</CardTitle>
            <CardDescription>Use {"{{variable}}"} in body if you track variables later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPersonas ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Persona</Label>
                  <Select value={personaId} onValueChange={setPersonaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select persona" />
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
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warm intro — trades" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body (markdown)</Label>
                  <Textarea id="body" rows={12} value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} />
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
                <Button
                  onClick={() => create.mutate()}
                  disabled={create.isPending || !personaId || !name.trim()}
                >
                  {create.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
