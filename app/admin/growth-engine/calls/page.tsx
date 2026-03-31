"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { GrowthCallEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function GrowthEngineCallsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [source, setSource] = useState("inbound");
  const [duration, setDuration] = useState("");
  const [tag, setTag] = useState<"qualified" | "not_qualified" | "missed" | "spam">("qualified");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/call-events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/call-events");
      return res.json() as Promise<{ calls: GrowthCallEvent[] }>;
    },
    enabled: !!user?.isAdmin,
  });

  const mut = useMutation({
    mutationFn: async () => {
      const d = duration.trim() ? Number(duration) : null;
      const res = await apiRequest("POST", "/api/admin/growth-engine/call-events", {
        source,
        durationSeconds: d != null && Number.isFinite(d) ? d : null,
        verificationTag: tag,
        note: "Manual log — dynamic number pooling can extend this table later.",
      });
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/call-events"] });
      toast({ title: "Logged" });
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
        <h1 className="text-2xl font-bold tracking-tight">Call tracking</h1>
        <p className="text-muted-foreground mt-1">Log calls and verification tags; swap numbers + recording in a later phase.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Log call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Source</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duration (sec)</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Select value={tag} onValueChange={(v) => setTag(v as typeof tag)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualified">qualified</SelectItem>
                <SelectItem value="not_qualified">not_qualified</SelectItem>
                <SelectItem value="missed">missed</SelectItem>
                <SelectItem value="spam">spam</SelectItem>
              </SelectContent>
            </Select>
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
            <CardTitle className="text-base">Recent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {(data?.calls ?? []).map((c) => (
              <div key={c.id} className="border-b border-border/60 py-2">
                {c.source} · {c.verificationTag ?? "—"} · {c.durationSeconds ?? "—"}s
              </div>
            ))}
          </CardContent>
        </Card>
      }
    </div>
  );
}
