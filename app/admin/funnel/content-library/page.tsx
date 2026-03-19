"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTENT_PLACEMENT_PAGES,
  CONTENT_PLACEMENT_SECTIONS,
  LEAD_MAGNET_SLUGS,
} from "@/lib/funnelContentPlacements";
import { apiRequest } from "@/lib/queryClient";

interface FunnelContentAsset {
  id: number;
  title: string;
  description: string | null;
  assetType: string;
  fileUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  status: string;
  leadMagnetSlug: string | null;
  placements: Array<{ pagePath: string; sectionId: string }>;
  createdAt: string;
  updatedAt: string;
}

const ASSET_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "pptx", label: "PowerPoint (PPTX)" },
  { value: "video", label: "Video" },
  { value: "slideshow", label: "Slideshow" },
] as const;

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminFunnelContentLibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlacements, setEditPlacements] = useState<Array<{ pagePath: string; sectionId: string }>>([]);
  const [newPagePath, setNewPagePath] = useState("");
  const [newSectionId, setNewSectionId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery<{ assets: FunnelContentAsset[] }>({
    queryKey: ["/api/admin/funnel-content-assets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/funnel-content-assets");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/admin/funnel-content-assets/${id}`, { data: updates });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnel-content-assets"] });
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/funnel-content-assets/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnel-content-assets"] });
    },
  });

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const titleInput = form.querySelector<HTMLInputElement>('input[name="title"]');
    const assetTypeInput = form.querySelector<HTMLSelectElement>('select[name="assetType"]');
    const leadMagnetInput = form.querySelector<HTMLSelectElement>('select[name="leadMagnetSlug"]');
    if (!fileInput?.files?.[0] || !titleInput?.value?.trim() || !assetTypeInput?.value) {
      setUploadError("File, title, and type are required.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", fileInput.files[0]);
      fd.append("title", titleInput.value.trim());
      fd.append("assetType", assetTypeInput.value);
      if (leadMagnetInput?.value) fd.append("leadMagnetSlug", leadMagnetInput.value);
      const res = await fetch("/api/admin/upload-content", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json?.error ?? "Upload failed");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnel-content-assets"] });
      form.reset();
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (asset: FunnelContentAsset) => {
    setEditId(asset.id);
    setEditPlacements([...(asset.placements ?? [])]);
    setNewPagePath("");
    setNewSectionId("");
  };

  const addPlacement = () => {
    if (newPagePath && newSectionId) {
      setEditPlacements((p) => [...p, { pagePath: newPagePath, sectionId: newSectionId }]);
      setNewPagePath("");
      setNewSectionId("");
    }
  };

  const removePlacement = (index: number) => {
    setEditPlacements((p) => p.filter((_, i) => i !== index));
  };

  const savePlacements = () => {
    if (editId == null) return;
    updateMutation.mutate({ id: editId, updates: { placements: editPlacements } });
  };

  const setStatus = (id: number, status: "draft" | "published") => {
    updateMutation.mutate({ id, updates: { status } });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assets = data?.assets ?? [];

  return (
    <div className="w-full min-w-0 max-w-full py-6 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground mb-2">
            <Link href="/admin/funnel">
              <ArrowLeft className="h-4 w-4" />
              Funnel
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Content Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDF, PowerPoint, and video for lead magnets. Publish and assign each asset to a page and section so it appears on the live site.
          </p>
        </div>

        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload content
            </CardTitle>
            <CardDescription>
              PDF, PPTX, or video. Files are saved and linked to lead magnets; set status to Published and add placements to show on pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Growth Audit One-Pager" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetType">Type</Label>
                  <select
                    id="assetType"
                    name="assetType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadMagnetSlug">Lead magnet (optional)</Label>
                <select
                  id="leadMagnetSlug"
                  name="leadMagnetSlug"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— None —</option>
                  {LEAD_MAGNET_SLUGS.map((m) => (
                    <option key={m.slug} value={m.slug}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" name="file" type="file" accept=".pdf,.pptx,.ppt,video/mp4,video/webm,video/quicktime" required />
                <p className="text-xs text-muted-foreground">PDF, PPTX, MP4, WebM, MOV. Max 80MB.</p>
              </div>
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
              <Button type="submit" disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-foreground mb-3">Uploaded content</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No content yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload a PDF, PPTX, or video above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{asset.title}</span>
                      <Badge variant={asset.status === "published" ? "default" : "secondary"} className="text-xs">
                        {asset.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase">{asset.assetType}</span>
                    </div>
                    {asset.leadMagnetSlug && (
                      <p className="text-xs text-muted-foreground mt-0.5">Lead magnet: {asset.leadMagnetSlug}</p>
                    )}
                    {(asset.placements?.length ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin className="h-3 w-3" />
                        {asset.placements!.map((p) => `${p.pagePath} → ${p.sectionId}`).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(asset.fileSizeBytes)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(asset)} className="gap-1">
                      <Pencil className="h-3.5 w-3.5" /> Placements
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(asset.id, asset.status === "published" ? "draft" : "published")}
                    >
                      {asset.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(asset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editId != null && (
          <Card className="mt-6 fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 shadow-lg border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Set placements</CardTitle>
              <CardDescription>Where this content appears on the site. Only published assets with at least one placement are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {editPlacements.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded border bg-muted/50 px-2 py-1.5 text-sm">
                  <span className="truncate">{p.pagePath} → {CONTENT_PLACEMENT_SECTIONS.find((s) => s.id === p.sectionId)?.label ?? p.sectionId}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePlacement(i)}>Remove</Button>
                </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <Select value={newPagePath} onValueChange={setNewPagePath}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Page" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_PLACEMENT_PAGES.map((p) => (
                      <SelectItem key={p.path} value={p.path}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newSectionId} onValueChange={setNewSectionId}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_PLACEMENT_SECTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" variant="secondary" onClick={addPlacement}>
                  Add
                </Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={savePlacements} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 border-muted bg-muted/30">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Upload a file, set status to Published, then add placements (page + section). Public pages can request assets via <code className="text-xs bg-muted px-1 rounded">GET /api/funnel/content-assets?pagePath=...&sectionId=...</code> and render download links or embeds.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
