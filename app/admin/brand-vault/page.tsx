"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Copy, Upload, FolderPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BRAND_TEMP_RETENTION_DAYS, BRAND_VAULT_MAX_UPLOAD_BYTES } from "@shared/brandVaultSchema";
import { format } from "date-fns";
import { MediaPreview, MediaPreviewThumb } from "@/components/media/MediaPreview";

const MAX_MB = Math.round(BRAND_VAULT_MAX_UPLOAD_BYTES / (1024 * 1024));

function describeUploadFailure(res: Response, bodyText: string, parsed: unknown): string {
  if (res.status === 413) {
    return (
      "The upload is larger than this deployment accepts. Many hosts stop at about 4.5MB per request, even when the app allows more — try compressing the file, reducing export quality, or splitting assets."
    );
  }
  if (res.status === 503) {
    return "The server returned unavailable — check your connection, disable offline mode if enabled, and try again.";
  }
  if (parsed && typeof parsed === "object" && parsed !== null) {
    const o = parsed as { error?: unknown; message?: unknown };
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  const t = bodyText.trim();
  if (t.length > 0 && t.length < 500) return t;
  return res.statusText || `Request failed (${res.status})`;
}

interface BrandTempFolder {
  id: number;
  name: string;
  folderKind: string;
  createdAt: string;
}

interface BrandTempFileRow {
  id: number;
  folderId: number;
  originalFilename: string;
  publicPath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  expiresAt: string;
}

export default function BrandVaultAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"documents" | "images">("documents");
  const [openFolderId, setOpenFolderId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStagedFile(null);
  }, [openFolderId]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: folders = [], isLoading } = useQuery<BrandTempFolder[]>({
    queryKey: ["/api/admin/brand-vault/folders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/brand-vault/folders");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<BrandTempFileRow[]>({
    queryKey: ["/api/admin/brand-vault/folders", openFolderId, "files"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/brand-vault/folders/${openFolderId}/files`);
      return res.json();
    },
    enabled: openFolderId != null && !!user?.isAdmin,
  });

  const createFolder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/brand-vault/folders", {
        name: newName.trim(),
        folderKind: newKind,
      });
      return res.json() as Promise<BrandTempFolder>;
    },
    onSuccess: () => {
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brand-vault/folders"] });
      toast({ title: "Folder created" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not create folder", description: e.message, variant: "destructive" }),
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/brand-vault/folders/${id}`);
    },
    onSuccess: (_, id) => {
      if (openFolderId === id) setOpenFolderId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brand-vault/folders"] });
      toast({ title: "Folder deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const deleteFile = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/brand-vault/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brand-vault/folders", openFolderId, "files"] });
      toast({ title: "File removed" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const copyUrl = async (path: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const full = `${origin}${path}`;
    try {
      await navigator.clipboard.writeText(full);
      toast({ title: "URL copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || openFolderId == null) return;
    if (file.size > BRAND_VAULT_MAX_UPLOAD_BYTES) {
      toast({
        title: "File too large",
        description: `Choose a file under ${MAX_MB}MB, or compress it first.`,
        variant: "destructive",
      });
      return;
    }
    setStagedFile(file);
  };

  const clearStagedFile = () => setStagedFile(null);

  const commitStagedUpload = async () => {
    const file = stagedFile;
    if (!file || openFolderId == null) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/brand-vault/folders/${openFolderId}/upload`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const bodyText = await res.text();
      let parsed: unknown = null;
      if (bodyText) {
        try {
          parsed = JSON.parse(bodyText) as unknown;
        } catch {
          parsed = null;
        }
      }
      if (!res.ok) {
        toast({
          title: "Upload failed",
          description: describeUploadFailure(res, bodyText, parsed),
          variant: "destructive",
        });
        return;
      }
      const row = parsed as BrandTempFileRow;
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brand-vault/folders", openFolderId, "files"] });
      toast({ title: "Uploaded", description: row?.originalFilename ?? file.name });
      setStagedFile(null);
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not reach the server — check your network or try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved) return null;

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Brand temp vault</h1>
      <p className="text-muted-foreground mb-4 max-w-2xl">
        Short-term folders for documents or images (e.g. brand work in progress). Files are removed automatically after{" "}
        {BRAND_TEMP_RETENTION_DAYS} days to save server space — copy URLs and archive offshore before expiry.
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl border-l-2 border-amber-500/60 pl-3">
        Per-file limit here is {MAX_MB}MB, but{" "}
        <strong className="font-medium text-foreground">production hosts often enforce ~4.5MB per request</strong>. If the
        browser reports a failed upload with no clear reason, try a smaller or compressed file first.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            New folder
          </CardTitle>
          <CardDescription>
            Documents (PDF, Office, CSV…) or media folders (images plus MP4, WebM, MOV, and other common video).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Q1 brand deck scratch"
            />
          </div>
          <div className="space-y-2">
            <Label>Kind</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "documents" | "images")}
            >
              <option value="documents">Documents</option>
              <option value="images">Images &amp; video</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => createFolder.mutate()}
            disabled={!newName.trim() || createFolder.isPending}
          >
            {createFolder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Folders</h2>
        {folders.length === 0 && <p className="text-sm text-muted-foreground">No folders yet.</p>}
        {folders.map((f) => (
          <Card key={f.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">{f.name}</CardTitle>
                <CardDescription>
                  {f.folderKind === "images" ? "Images & video" : "Documents"} · created{" "}
                  {format(new Date(f.createdAt), "PP")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={openFolderId === f.id ? "secondary" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setOpenFolderId(openFolderId === f.id ? null : f.id)}
                >
                  {openFolderId === f.id ? "Close" : "Files"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Delete folder “${f.name}” and all files?`)) deleteFolder.mutate(f.id);
                  }}
                  disabled={deleteFolder.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {openFolderId === f.id && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      key={openFolderId ?? 0}
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      disabled={uploading}
                      onChange={onPickFile}
                      aria-label="Choose file to preview and upload"
                      accept={
                        f.folderKind === "images"
                          ? "image/*,video/mp4,video/webm,video/quicktime,video/ogg,video/x-msvideo,video/3gpp,video/x-matroska,video/x-ms-wmv,.mp4,.webm,.mov,.avi,.mkv,.wmv,.3gp,.ogv"
                          : undefined
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose file
                    </Button>
                    {stagedFile && (
                      <>
                        <Button type="button" size="sm" disabled={uploading} onClick={() => void commitStagedUpload()}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {uploading ? "Uploading…" : "Upload to folder"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={clearStagedFile}>
                          Clear
                        </Button>
                      </>
                    )}
                    {uploading && !stagedFile && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {stagedFile && (
                    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Preview — confirm upload or clear to pick another file.
                      </p>
                      <MediaPreview file={stagedFile} />
                    </div>
                  )}
                </div>
                {filesLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files in this folder.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {files.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <MediaPreviewThumb
                            src={row.publicPath}
                            mimeType={row.mimeType}
                            label={row.originalFilename}
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{row.originalFilename}</div>
                            <div className="text-muted-foreground text-xs">
                              {(row.sizeBytes / 1024).toFixed(1)} KB · expires {format(new Date(row.expiresAt), "PP")}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button type="button" variant="outline" size="sm" onClick={() => copyUrl(row.publicPath)}>
                            <Copy className="h-3 w-3 mr-1" />
                            URL
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteFile.mutate(row.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
