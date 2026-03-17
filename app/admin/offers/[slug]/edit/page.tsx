"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Type,
  DollarSign,
  Package,
  ListChecks,
  MousePointer,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePicker } from "@/components/admin/ImagePicker";
import {
  DEFAULT_OFFER_SECTIONS,
  type OfferSections,
  type OfferHero,
  type OfferPrice,
  type OfferDeliverable,
  type OfferCta,
} from "@/lib/offerSections";

const ICON_OPTIONS = [
  "FileText",
  "MessageSquare",
  "Map",
  "Layout",
  "ClipboardList",
  "CheckCircle2",
  "Target",
  "Zap",
  "Sparkles",
  "BarChart3",
  "Lightbulb",
  "Rocket",
];

function mergeSections(existing: Record<string, unknown> | null): OfferSections {
  const def = DEFAULT_OFFER_SECTIONS;
  if (!existing || typeof existing !== "object") return def;
  return {
    hero: { ...def.hero, ...(existing.hero as object) } as OfferHero,
    price: { ...def.price, ...(existing.price as object) } as OfferPrice,
    deliverables: Array.isArray(existing.deliverables)
      ? (existing.deliverables as OfferDeliverable[]).map((d) => ({
          icon: d.icon || "FileText",
          title: d.title ?? "",
          desc: d.desc ?? "",
          imageUrl: d.imageUrl,
        }))
      : def.deliverables,
    bullets: Array.isArray(existing.bullets) ? existing.bullets as string[] : def.bullets,
    cta: { ...def.cta, ...(existing.cta as object) } as OfferCta,
    graphics: (existing.graphics as { bannerUrl?: string }) ?? {},
  };
}

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = (params.slug as string) ?? "";
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [sections, setSections] = useState<OfferSections>(DEFAULT_OFFER_SECTIONS);

  const { data: offer, isLoading, isFetched } = useQuery({
    queryKey: ["/api/admin/offers", slug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/offers/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!offer) {
      if (isFetched) {
        setName(slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
        setMetaTitle("");
        setMetaDescription("");
        setSections(mergeSections(null));
      }
      return;
    }
    setName(offer.name ?? slug);
    setMetaTitle(offer.metaTitle ?? "");
    setMetaDescription(offer.metaDescription ?? "");
    setSections(mergeSections(offer.sections));
  }, [offer, slug, isFetched]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        sections: sections as unknown as Record<string, unknown>,
      };
      if (offer) {
        const res = await apiRequest("PATCH", `/api/admin/offers/${slug}`, payload);
        if (!res.ok) throw new Error("Failed to save");
        return res.json();
      }
      const res = await apiRequest("POST", "/api/admin/offers", { slug, ...payload });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers", slug] });
      toast({ title: "Offer saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const setHero = (updates: Partial<OfferHero>) =>
    setSections((s) => ({ ...s, hero: { ...s.hero, ...updates } as OfferHero }));
  const setPrice = (updates: Partial<OfferPrice>) =>
    setSections((s) => ({ ...s, price: { ...s.price, ...updates } as OfferPrice }));
  const setCta = (updates: Partial<OfferCta>) =>
    setSections((s) => ({ ...s, cta: { ...s.cta, ...updates } as OfferCta }));

  const addDeliverable = () =>
    setSections((s) => ({
      ...s,
      deliverables: [...(s.deliverables ?? []), { icon: "FileText", title: "", desc: "" }],
    }));
  const updateDeliverable = (i: number, updates: Partial<OfferDeliverable>) =>
    setSections((s) => ({
      ...s,
      deliverables: (s.deliverables ?? []).map((d, idx) => (idx === i ? { ...d, ...updates } : d)),
    }));
  const removeDeliverable = (i: number) =>
    setSections((s) => ({ ...s, deliverables: (s.deliverables ?? []).filter((_, idx) => idx !== i) }));

  const addBullet = () => setSections((s) => ({ ...s, bullets: [...(s.bullets ?? []), ""] }));
  const updateBullet = (i: number, v: string) =>
    setSections((s) => ({ ...s, bullets: (s.bullets ?? []).map((b, idx) => (idx === i ? v : b)) }));
  const removeBullet = (i: number) =>
    setSections((s) => ({ ...s, bullets: (s.bullets ?? []).filter((_, idx) => idx !== i) }));

  const setGraphics = (updates: Record<string, string>) =>
    setSections((s) => ({ ...s, graphics: { ...s.graphics, ...updates } }));

  if (!slug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Missing offer slug.</p>
        <Button variant="link" asChild><Link href="/admin/offers">Back to offers</Link></Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/offers"><ArrowLeft className="h-4 w-4 mr-2" />Back to offers</Link>
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-1">Edit offer</h1>
        <p className="text-muted-foreground text-sm mb-6">/offers/{slug}</p>

        {/* Meta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4" />Meta & SEO</CardTitle>
            <CardDescription>Offer name and page meta for search results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Startup growth system" />
            </div>
            <div>
              <Label>Meta title</Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Page title for SEO" />
            </div>
            <div>
              <Label>Meta description</Label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} placeholder="Short description for search results" />
            </div>
          </CardContent>
        </Card>

        {/* Hero */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4" />Hero section</CardTitle>
            <CardDescription>Main headline and subtitle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={sections.hero?.title ?? ""}
                onChange={(e) => setHero({ title: e.target.value })}
                placeholder="Offer headline"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea
                value={sections.hero?.subtitle ?? ""}
                onChange={(e) => setHero({ subtitle: e.target.value })}
                rows={3}
                placeholder="Supporting copy"
              />
            </div>
            <div>
              <Label>Hero image URL (optional)</Label>
              <Input
                value={sections.hero?.imageUrl ?? ""}
                onChange={(e) => setHero({ imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Price section</CardTitle>
            <CardDescription>Price label, amount, and note.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input value={sections.price?.label ?? ""} onChange={(e) => setPrice({ label: e.target.value })} placeholder="e.g. Price range" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input value={sections.price?.amount ?? ""} onChange={(e) => setPrice({ amount: e.target.value })} placeholder="e.g. $249 – $399" />
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={sections.price?.note ?? ""} onChange={(e) => setPrice({ note: e.target.value })} rows={2} placeholder="One-time audit..." />
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Deliverables</CardTitle>
                <CardDescription>What the customer gets (icon, title, description).</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDeliverable}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(sections.deliverables ?? []).map((d, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Item {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDeliverable(i)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`deliverable-icon-${i}`} className="text-xs">Icon</Label>
                    <select
                      id={`deliverable-icon-${i}`}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={d.icon}
                      onChange={(e) => updateDeliverable(i, { icon: e.target.value })}
                      aria-label="Icon for deliverable"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={d.title} onChange={(e) => updateDeliverable(i, { title: e.target.value })} placeholder="Title" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={d.desc} onChange={(e) => updateDeliverable(i, { desc: e.target.value })} rows={2} placeholder="Description" />
                </div>
                <ImagePicker
                  label="Image (optional)"
                  value={d.imageUrl ?? ""}
                  onChange={(url) => updateDeliverable(i, { imageUrl: url })}
                  compact
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bullets */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" />Bullet points</CardTitle>
                <CardDescription>Short benefit bullets (e.g. no long-term commitment).</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBullet}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(sections.bullets ?? []).map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input value={b} onChange={(e) => updateBullet(i, e.target.value)} placeholder="Bullet text" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBullet(i)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MousePointer className="h-4 w-4" />Call to action</CardTitle>
            <CardDescription>Button and footnote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Button text</Label>
              <Input value={sections.cta?.buttonText ?? ""} onChange={(e) => setCta({ buttonText: e.target.value })} placeholder="Get startup growth system" />
            </div>
            <div>
              <Label>Button link</Label>
              <Input value={sections.cta?.buttonHref ?? ""} onChange={(e) => setCta({ buttonHref: e.target.value })} placeholder="/strategy-call" />
            </div>
            <div>
              <Label>Footnote</Label>
              <Textarea value={sections.cta?.footnote ?? ""} onChange={(e) => setCta({ footnote: e.target.value })} rows={2} placeholder="You'll be taken to book..." />
            </div>
          </CardContent>
        </Card>

        {/* Graphics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" />Graphics</CardTitle>
            <CardDescription>Optional image URLs for the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImagePicker
              label="Banner image URL"
              value={sections.graphics?.bannerUrl ?? ""}
              onChange={(url) => setGraphics({ bannerUrl: url })}
            />
          </CardContent>
        </Card>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full sm:w-auto">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
