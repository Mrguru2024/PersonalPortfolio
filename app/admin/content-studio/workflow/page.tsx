"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function ContentStudioWorkflowPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [docId, setDocId] = useState("");
  const [platform, setPlatform] = useState("manual");

  const { data: adapters } = useQuery({
    queryKey: ["/api/admin/content-studio/adapters"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content-studio/adapters", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ adapters: { key: string; displayName: string; active: boolean }[] }>;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/admin/content-studio/publish-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content-studio/publish-logs?limit=40", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        logs: Array<{
          id: number;
          documentId: number | null;
          platform: string;
          status: string;
          createdAt: string;
          errorMessage: string | null;
        }>;
      }>;
    },
  });

  const manualPub = useMutation({
    mutationFn: async () => {
      const id = parseInt(docId, 10);
      if (Number.isNaN(id)) throw new Error("Invalid document id");
      const res = await fetch("/api/admin/content-studio/publish/manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, platform }),
      });
      if (!res.ok) throw new Error("Publish log failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/publish-logs"] });
      toast({ title: "Publish logged (scaffold)" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            Images in content
          </CardTitle>
          <CardDescription>
            You do not need JSON or a separate upload screen for post images. Open any document, use the editor&apos;s{" "}
            <strong>image</strong> button, then <strong>Upload from computer</strong> (JPEG, PNG, GIF, WebP) or paste an
            image URL. The same editor is used for newsletters and email designs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/content-studio/documents">Go to document library</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform adapters</CardTitle>
          <CardDescription>Foundation for Buffer-style connectors; all inactive until API keys are wired.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(adapters?.adapters ?? []).map((a) => (
              <li key={a.key} className="flex justify-between rounded border border-border/60 px-3 py-2">
                <span>{a.displayName}</span>
                <span className="text-muted-foreground font-mono text-xs">{a.key}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual publish (log only)</CardTitle>
          <CardDescription>Records intent in publish_logs — does not call external networks in phase 2.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end max-w-xl">
          <div className="space-y-1">
            <Label>Document ID</Label>
            <Input value={docId} onChange={(e) => setDocId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">manual</SelectItem>
                <SelectItem value="blog">blog</SelectItem>
                <SelectItem value="newsletter">newsletter</SelectItem>
                <SelectItem value="social_placeholder">social_placeholder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => manualPub.mutate()} disabled={manualPub.isPending}>
            {manualPub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log publish"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publish logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(logs?.logs ?? []).map((l) => (
                <li key={l.id} className="rounded-lg border border-border/50 p-3">
                  <div className="font-medium">
                    doc {l.documentId ?? "—"} · {l.platform} · {l.status}
                  </div>
                  <div className="text-xs text-muted-foreground">{format(new Date(l.createdAt), "PPp")}</div>
                  {l.errorMessage && <p className="text-destructive text-xs mt-1">{l.errorMessage}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
