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
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";

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
      if (Number.isNaN(id)) throw new Error("Enter a valid document number");
      const res = await fetch("/api/admin/content-studio/publish/manual", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, platform }),
      });
      if (!res.ok) throw new Error("Could not save");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/content-studio/publish-logs"] });
      toast({ title: "Recorded in history" });
    },
    onError: (e: Error) => toast({ title: "Something went wrong", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            Images in posts
          </CardTitle>
          <CardDescription>
            Open any document and use the editor&apos;s image button—upload from your computer or paste a link. Same editor
            is used for email when you use it there.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/content-studio/documents">Document library</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>
            Places the calendar can send to. If one is greyed out or missing, set it up under Connections &amp; email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(adapters?.adapters ?? []).map((a) => (
              <li key={a.key} className="flex justify-between rounded border border-border/60 px-3 py-2 gap-2">
                <span>{a.displayName}</span>
                <span className="text-muted-foreground text-xs shrink-0">{a.active ? "On" : "Off"}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a history row (support)</CardTitle>
          <CardDescription>
            Saves a line in the table below for troubleshooting. It does <strong>not</strong> post to Facebook or other
            networks by itself.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end max-w-xl">
          <div className="space-y-1">
            <Label>Document number</Label>
            <Input value={docId} onChange={(e) => setDocId(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Internal note</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="social_placeholder">Social (test)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => manualPub.mutate()} disabled={manualPub.isPending}>
            {manualPub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to history"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>What the system recorded for scheduled posts (success and errors).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(logs?.logs ?? []).map((l) => (
                <li key={l.id} className="rounded-lg border border-border/50 p-3">
                  <div className="font-medium">
                    Document {l.documentId ?? "—"} · {l.platform} · {l.status}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatLocaleMediumDateTime(l.createdAt)}</div>
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
