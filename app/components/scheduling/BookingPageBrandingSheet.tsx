"use client";

import { useEffect, useState } from "react";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type BookingPageCardStyle,
  type BookingPageHeroGradient,
  type BookingPageTheme,
  bookingPageThemeFromSettingsJson,
  mergeBrandingIntoSettingsJson,
  normalizeHexColor,
} from "@/lib/bookingPageTheme";

export type BookingPageBrandingTarget = {
  id: number;
  slug: string;
  title: string;
  settingsJson: Record<string, unknown> | null;
};

export interface BookingPageBrandingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: BookingPageBrandingTarget | null;
  onSaved: () => void;
}

export function BookingPageBrandingSheet({
  open,
  onOpenChange,
  page,
  onSaved,
}: BookingPageBrandingSheetProps) {
  const [accent, setAccent] = useState("#7c3aed");
  const [cardStyle, setCardStyle] = useState<BookingPageCardStyle>("glass");
  const [heroGradient, setHeroGradient] = useState<BookingPageHeroGradient>("aurora");
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!page || !open) return;
    const t = bookingPageThemeFromSettingsJson(page.settingsJson);
    setAccent(t.accentColor ?? "#7c3aed");
    setCardStyle(t.cardStyle);
    setHeroGradient(t.heroGradient);
    setHeroUrl(t.heroImageUrl);
    setError(null);
  }, [page, open]);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Upload failed");
      if (typeof j.url === "string") setHeroUrl(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!page) return;
    setSaving(true);
    setError(null);
    try {
      const themed: BookingPageTheme = {
        heroImageUrl: heroUrl,
        accentColor: normalizeHexColor(accent),
        cardStyle,
        heroGradient,
      };
      const settingsJson = mergeBrandingIntoSettingsJson(page.settingsJson, themed);
      const res = await fetch(`/api/admin/scheduler/booking-pages/${page.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingsJson }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(100vw-0.5rem,24rem)] sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Booking page appearance</SheetTitle>
          <SheetDescription className="text-left">
            Customize <span className="font-medium text-foreground">{page?.title}</span> (
            <span className="font-mono text-xs">/book/{page?.slug}</span>). Changes apply to the public page only.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 px-1">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="bp-accent">Accent color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="bp-accent"
                type="color"
                className={cn("h-12 w-14 cursor-pointer rounded-lg border p-1 shrink-0")}
                value={normalizeHexColor(accent) ?? "#7c3aed"}
                onChange={(e) => setAccent(e.target.value)}
              />
              <Input
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                placeholder="#7c3aed"
                className="font-mono text-sm min-h-[48px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used for highlights, selected time slots, and the confirm button.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Card style</Label>
            <Select value={cardStyle} onValueChange={(v) => setCardStyle(v as BookingPageCardStyle)}>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glass">Glass (blurred, modern)</SelectItem>
                <SelectItem value="default">Solid elevated</SelectItem>
                <SelectItem value="minimal">Minimal border</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hero background</Label>
            <Select value={heroGradient} onValueChange={(v) => setHeroGradient(v as BookingPageHeroGradient)}>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (image only, if set)</SelectItem>
                <SelectItem value="aurora">Aurora (default)</SelectItem>
                <SelectItem value="sunset">Sunset</SelectItem>
                <SelectItem value="ocean">Ocean</SelectItem>
                <SelectItem value="midnight">Midnight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title banner image</Label>
            <p className="text-xs text-muted-foreground">
              Optional wide photo behind your title. JPEG or PNG, max 10MB (optimized on upload).
            </p>
            {heroUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted aspect-[21/9] max-h-36">
                <img src={heroUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2 min-h-[44px]"
                disabled={uploading}
                onClick={() => document.getElementById("bp-hero-file")?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Upload image
              </Button>
              {heroUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive min-h-[44px]"
                  onClick={() => setHeroUrl(null)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              ) : null}
              <input
                id="bp-hero-file"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onUpload(f);
                }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" className="flex-1 min-h-[48px]" disabled={saving || !page} onClick={() => void save()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save appearance"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
