"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Palette, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingPageBrandingSheet } from "@/components/scheduling/BookingPageBrandingSheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MeetingType = { id: number; name: string; slug: string };
type BookingPage = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string | null;
  bestForBullets: string[];
  bookingTypeId: number;
  hostMode: string;
  fixedHostUserId: number | null;
  locationType: string;
  paymentRequirement: string;
  depositCents: number | null;
  active: boolean;
  formFieldsJson: Array<{ id: string; label: string; type: "text" | "textarea"; required?: boolean }>;
  settingsJson?: Record<string, unknown> | null;
};

export default function SchedulerBookingPagesPage() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [types, setTypes] = useState<MeetingType[]>([]);
  const [saving, setSaving] = useState(false);
  const [brandingPage, setBrandingPage] = useState<BookingPage | null>(null);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    shortDescription: "",
    bestForRaw: "",
    bookingTypeId: "" as string | number,
    hostMode: "inherit",
    paymentRequirement: "none",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/scheduler/booking-pages", { credentials: "include" });
    const j = await res.json();
    setPages(j.pages ?? []);
    setTypes(j.types ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useEffect(() => {
    if (!types.length) return;
    setForm((s) => {
      const id = s.bookingTypeId;
      const n = typeof id === "number" ? id : parseInt(String(id), 10);
      if (id === "" || !Number.isFinite(n) || !types.some((t) => t.id === n)) {
        return { ...s, bookingTypeId: types[0]!.id };
      }
      return s;
    });
  }, [types]);

  async function createPage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const bullets = form.bestForRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const tid =
        typeof form.bookingTypeId === "number"
          ? form.bookingTypeId
          : parseInt(String(form.bookingTypeId), 10);
      const res = await fetch("/api/admin/scheduler/booking-pages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          shortDescription: form.shortDescription || null,
          bestForBullets: bullets,
          bookingTypeId: tid,
          hostMode: form.hostMode,
          paymentRequirement: form.paymentRequirement,
          formFieldsJson: [],
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "Could not create");
        return;
      }
      setForm({
        slug: "",
        title: "",
        shortDescription: "",
        bestForRaw: "",
        bookingTypeId: types[0]?.id ?? "",
        hostMode: "inherit",
        paymentRequirement: "none",
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deactivatePage(id: number) {
    if (!confirm("Deactivate this booking page?")) return;
    const res = await fetch(`/api/admin/scheduler/booking-pages/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Could not update");
      return;
    }
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking pages</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Each page matches one meeting type and gets its own shareable booking link. You can note whether a deposit or
          full payment is expected; card charging is configured separately in Payments when enabled.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              New booking page
            </CardTitle>
            <CardDescription>The short name becomes part of the public link—keep it simple and memorable.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPage} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="bp-slug">Short link name</Label>
                <Input
                  id="bp-slug"
                  value={form.slug}
                  onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="e.g. strategy-intake"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bp-title">Title</Label>
                <Input
                  id="bp-title"
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bp-desc">Short description</Label>
                <Textarea
                  id="bp-desc"
                  value={form.shortDescription}
                  onChange={(e) => setForm((s) => ({ ...s, shortDescription: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Meeting type</Label>
                <Select
                  value={String(form.bookingTypeId || (types[0]?.id ?? ""))}
                  onValueChange={(v) => setForm((s) => ({ ...s, bookingTypeId: parseInt(v, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Host mode</Label>
                  <Select
                    value={form.hostMode}
                    onValueChange={(v) => setForm((s) => ({ ...s, hostMode: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit pool</SelectItem>
                      <SelectItem value="fixed">Fixed host (always the same person)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Payment</Label>
                  <Select
                    value={form.paymentRequirement}
                    onValueChange={(v) => setForm((s) => ({ ...s, paymentRequirement: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="deposit">Deposit expected</SelectItem>
                      <SelectItem value="full">Full payment expected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bp-best">Best for (one bullet per line)</Label>
                <Textarea
                  id="bp-best"
                  value={form.bestForRaw}
                  onChange={(e) => setForm((s) => ({ ...s, bestForRaw: e.target.value }))}
                  rows={3}
                  placeholder="Founders planning a rebuild&#10;Teams needing a technical audit"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create page"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active pages</CardTitle>
            <CardDescription>Preview links open the conversion flow on your domain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pages.filter((p) => p.active).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pages yet.</p>
            ) : (
              pages
                .filter((p) => p.active)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/60 p-3"
                  >
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Link: {p.slug}
                        {p.paymentRequirement !== "none"
                          ? ` · Payment: ${p.paymentRequirement === "deposit" ? "deposit" : "full"}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5 min-h-[44px] sm:min-h-9"
                        onClick={() => {
                          setBrandingPage(p);
                          setBrandingOpen(true);
                        }}
                      >
                        <Palette className="h-4 w-4 shrink-0" aria-hidden />
                        Customize look
                      </Button>
                      <Button asChild size="sm" variant="secondary" className="min-h-[44px] sm:min-h-9">
                        <Link href={`/book/${p.slug}`} target="_blank" rel="noreferrer">
                          Preview
                        </Link>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="min-h-[44px] sm:min-h-9" onClick={() => deactivatePage(p.id)}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <BookingPageBrandingSheet
        open={brandingOpen}
        onOpenChange={setBrandingOpen}
        page={
          brandingPage
            ? {
                id: brandingPage.id,
                slug: brandingPage.slug,
                title: brandingPage.title,
                settingsJson: brandingPage.settingsJson ?? null,
              }
            : null
        }
        onSaved={() => void load()}
      />
    </div>
  );
}
