"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { EmailHubAsset } from "@shared/emailHubSchema";
import { useToast } from "@/hooks/use-toast";

export default function EmailHubAssetsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/assets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/assets");
      if (!res.ok) throw new Error("assets");
      return (await res.json()) as EmailHubAsset[];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name.replace(/\.[^.]+$/, ""));
    const res = await fetch("/api/admin/email-hub/assets/upload", { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    toast({ title: "Asset uploaded" });
    qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/assets"] });
    e.target.value = "";
  }

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Brand assets</h2>
          <p className="text-sm text-muted-foreground">Images & PDFs for insert in the composer (URLs stored in email-safe HTML).</p>
        </div>
        <div>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />
          <Button type="button" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border/60 p-3 bg-card/80 space-y-2">
              <p className="font-medium text-sm truncate">{a.name}</p>
              {a.mimeType?.startsWith("image/") ?
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image src={a.fileUrl} alt={a.altText ?? ""} fill className="object-contain" unoptimized sizes="200px" />
                </div>
              : null}
              <code className="text-[10px] break-all text-muted-foreground">{a.fileUrl}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
