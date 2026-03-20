"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Upload, Link2 } from "lucide-react";

const PROJECT = "ascendra_main";

export default function ContentStudioImportExportPage() {
  const { toast } = useToast();
  const [importTarget, setImportTarget] = useState<"calendar" | "documents">("calendar");
  const [importFormat, setImportFormat] = useState<"csv" | "json" | "ical">("csv");
  const [payload, setPayload] = useState("");
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchKind, setFetchKind] = useState<"ical" | "sheet_csv">("ical");

  const doImport = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/content-studio/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: PROJECT,
          target: importTarget,
          format: importFormat,
          payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Import failed");
      }
      return res.json() as Promise<{ created: number; skipped: number; errors: string[] }>;
    },
    onSuccess: (d) => {
      toast({
        title: "Import complete",
        description: `Created ${d.created}, skipped ${d.skipped}`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const doImportUrl = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/content-studio/import-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey: PROJECT, url: fetchUrl, kind: fetchKind }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Import failed");
      }
      return res.json();
    },
    onSuccess: (d) => {
      toast({
        title: "URL import complete",
        description: `Created ${(d as { created?: number }).created ?? 0} entries`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const exportHref = (kind: "calendar" | "documents", format: "csv" | "json") => {
    const q = new URLSearchParams({ kind, format, projectKey: PROJECT });
    return `/api/admin/content-studio/export?${q}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Import / export</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pull from Google Calendar (iCal URL) or Google Sheets (published CSV export). Also supports pasted CSV,
          JSON, or .ics text.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </CardTitle>
            <CardDescription>Download current editorial data (opens in new tab when logged in).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={exportHref("calendar", "csv")} target="_blank" rel="noreferrer">
                Calendar CSV
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={exportHref("calendar", "json")} target="_blank" rel="noreferrer">
                Calendar JSON
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={exportHref("documents", "csv")} target="_blank" rel="noreferrer">
                Documents CSV
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={exportHref("documents", "json")} target="_blank" rel="noreferrer">
                Documents JSON
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Import from Google URL
            </CardTitle>
            <CardDescription>
              Allowlisted hosts only: <code className="text-xs">calendar.google.com</code> iCal or{" "}
              <code className="text-xs">docs.google.com/spreadsheets</code> CSV export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Kind</Label>
              <Select value={fetchKind} onValueChange={(v) => setFetchKind(v as typeof fetchKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ical">Google Calendar (iCal feed URL)</SelectItem>
                  <SelectItem value="sheet_csv">Google Sheet (published CSV export URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/..."
              />
            </div>
            <Button
              onClick={() => doImportUrl.mutate()}
              disabled={doImportUrl.isPending || !fetchUrl.trim()}
            >
              {doImportUrl.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Fetch & import
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Paste import
          </CardTitle>
          <CardDescription>
            Calendar CSV columns: <code className="text-xs">title, scheduled_at, timezone, …</code> · Documents
            JSON: array of <code className="text-xs">{"{ title, contentType, bodyHtml }"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Target</Label>
              <Select value={importTarget} onValueChange={(v) => setImportTarget(v as typeof importTarget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Editorial calendar</SelectItem>
                  <SelectItem value="documents">CMS documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Format</Label>
              <Select
                value={importFormat}
                onValueChange={(v) => setImportFormat(v as typeof importFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {importTarget === "calendar" ? (
                    <>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="ical">iCal (.ics text)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON array</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={12}
            className="font-mono text-xs"
            placeholder="Paste CSV, JSON, or iCal here…"
          />
          <Button onClick={() => doImport.mutate()} disabled={doImport.isPending || !payload.trim()}>
            {doImport.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Import
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
