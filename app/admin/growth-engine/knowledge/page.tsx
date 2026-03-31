"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthKnowledgeEntry } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function GrowthEngineKnowledgePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [industry, setIndustry] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/knowledge"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/knowledge");
      return res.json() as Promise<{ entries: GrowthKnowledgeEntry[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/growth-engine/knowledge", {
        title: title.trim() || "Untitled",
        body: body.trim() || "—",
        industry: industry.trim() || null,
        tags: [],
      });
      return res.json();
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/knowledge"] });
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/overview"] });
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Internal knowledge</h1>
        <p className="text-muted-foreground mt-1">Admin-only learnings across accounts — not shown on client dashboards.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">New entry</CardTitle>
          <CardDescription>Tag by industry or persona as you standardize vocabulary.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. home services" />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Save"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin" />
      : <Card>
          <CardHeader>
            <CardTitle className="text-base">Library</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {(data?.entries ?? []).map((e) => (
              <div key={e.id} className="border-b border-border/60 pb-2">
                <p className="font-medium">{e.title}</p>
                <p className="text-muted-foreground text-xs">{e.industry ?? "—"}</p>
                <p className="mt-1 whitespace-pre-wrap">{e.body.slice(0, 280)}{e.body.length > 280 ? "…" : ""}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      }
    </div>
  );
}
