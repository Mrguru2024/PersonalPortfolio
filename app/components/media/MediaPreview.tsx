"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaPreviewProps = {
  /** Local file — preview uses an object URL (cleaned up on unmount). */
  file?: File | null;
  /** Public URL (path or absolute) when the asset is already stored. */
  src?: string | null;
  /** Optional MIME (defaults from `file.type` when `file` is set). */
  mimeType?: string | null;
  className?: string;
  /** Tailwind max-height class for image/video/pdf frame */
  mediaClassName?: string;
};

function resolveDisplaySrc(origin: string, src: string | null | undefined): string | null {
  if (!src?.trim()) return null;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("blob:")) return s;
  if (s.startsWith("/")) return `${origin}${s}`;
  return s;
}

export function MediaPreview({ file, src, mimeType, className, mediaClassName }: MediaPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const mime = (mimeType ?? file?.type ?? "").toLowerCase();
  const rawSrc = objectUrl ?? src;
  const displaySrc = resolveDisplaySrc(origin, rawSrc);

  if (!displaySrc) return null;

  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime === "application/pdf" || displaySrc.toLowerCase().includes(".pdf");

  if (isImage) {
    return (
      <div className={cn("overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- blob + arbitrary admin URLs */}
        <img
          src={displaySrc}
          alt=""
          className={cn(
            "w-full rounded-md border border-border bg-muted/40 object-contain mx-auto",
            mediaClassName ?? "max-h-56"
          )}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <video
          src={displaySrc}
          controls
          playsInline
          className={cn("w-full rounded-md border border-border bg-black", mediaClassName ?? "max-h-64")}
          preload="metadata"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={cn("overflow-hidden", className)}>
        <iframe
          title="PDF preview"
          src={displaySrc}
          className={cn("w-full rounded-md border border-border bg-background", mediaClassName ?? "h-64 max-h-72")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground",
        className
      )}
    >
      <FileText className="h-10 w-10 shrink-0 opacity-60" aria-hidden />
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{file?.name ?? "Selected file"}</p>
        <p className="text-xs">No inline preview for this type. It will still upload.</p>
      </div>
    </div>
  );
}

/** Compact thumb for list rows: image, video first frame, or icon. */
export function MediaPreviewThumb({
  src,
  mimeType,
  label,
  className,
}: {
  src: string | null;
  mimeType: string | null;
  label?: string;
  className?: string;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const displaySrc = resolveDisplaySrc(origin, src);
  const mime = (mimeType ?? "").toLowerCase();
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isPdf = mime === "application/pdf";

  const wrap = cn(
    "shrink-0 rounded-md border border-border bg-muted/50 overflow-hidden flex items-center justify-center",
    className ?? "h-14 w-24"
  );

  if (displaySrc && isImage) {
    return (
      <div className={wrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displaySrc} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (displaySrc && isVideo) {
    return (
      <div className={cn(wrap, "relative")}>
        <video
          src={displaySrc}
          muted
          playsInline
          className="h-full w-full object-cover"
          preload="metadata"
          aria-label={label ?? "Video thumbnail"}
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className={cn(wrap, "bg-background")}>
        <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn(wrap, "bg-background")} title={label}>
      <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
    </div>
  );
}
