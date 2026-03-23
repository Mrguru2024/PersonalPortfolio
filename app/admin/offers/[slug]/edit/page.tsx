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
  Award,
  Brain,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DEFAULT_OFFER_SECTIONS,
  parseOfferIqTargeting,
  type OfferSections,
  type OfferHero,
  type OfferPrice,
  type OfferDeliverable,
  type OfferCta,
  type OfferIqTargeting,
  type AudienceTenureBand,
  type AudienceVisionInvestment,
} from "@/lib/offerSections";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickCreatePersonaModal } from "@/components/admin/QuickCreatePersonaModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const iq = parseOfferIqTargeting(existing.iqTargeting);
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
    ...(iq ? { iqTargeting: iq } : {}),
  };
}

function sectionsWithoutIq(s: OfferSections): Record<string, unknown> {
  const { iqTargeting: _iq, ...rest } = s;
  return rest as Record<string, unknown>;
}

function patchIqTargeting(
  prev: OfferSections,
  updates: {
    personaIds?: string[];
    audienceTenureBand?: AudienceTenureBand | null;
    audienceVisionInvestment?: AudienceVisionInvestment | null;
  }
): OfferIqTargeting | undefined {
  const cur = prev.iqTargeting;
  const personaIds = updates.personaIds ?? cur?.personaIds ?? [];
  let tenure = cur?.audienceTenureBand;
  let vision = cur?.audienceVisionInvestment;
  if ("audienceTenureBand" in updates) {
    tenure = updates.audienceTenureBand ?? undefined;
  }
  if ("audienceVisionInvestment" in updates) {
    vision = updates.audienceVisionInvestment ?? undefined;
  }
  if (personaIds.length === 0 && !tenure && !vision) return undefined;
  const out: OfferIqTargeting = { personaIds };
  if (tenure) out.audienceTenureBand = tenure;
  if (vision) out.audienceVisionInvestment = vision;
  return out;
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
  const [quickPersonaOpen, setQuickPersonaOpen] = useState(false);
  const [aiFillOpen, setAiFillOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiIncludeCurrent, setAiIncludeCurrent] = useState(true);

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

  const { data: personasData } = useQuery({
    queryKey: ["/api/admin/ascendra-intelligence/personas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ascendra-intelligence/personas");
      if (!res.ok) throw new Error("Failed to load personas");
      return (await res.json()) as { personas: { id: string; displayName: string }[] };
    },
  });
  const iqPersonas = personasData?.personas ?? [];

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

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/offers/${slug}/grade`);
      if (!res.ok) throw new Error("Failed to grade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers", slug] });
      toast({ title: "Content graded" });
    },
    onError: (e: Error) => toast({ title: "Grade failed", description: e.message, variant: "destructive" }),
  });

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

  const aiFillMutation = useMutation({
    mutationFn: async (vars: { prompt: string; includeCurrent: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/offers/ai-generate", {
        prompt: vars.prompt,
        slug,
        includeCurrent: vars.includeCurrent,
        ...(vars.includeCurrent
          ? {
              currentOffer: {
                name: name.trim(),
                metaTitle: metaTitle.trim() || null,
                metaDescription: metaDescription.trim() || null,
                sections: sectionsWithoutIq(sections),
              },
            }
          : {}),
      });
      return res.json() as Promise<{
        offer: {
          name: string;
          metaTitle: string;
          metaDescription: string;
          hero: { title: string; subtitle: string; imageUrl?: string };
          price: OfferPrice;
          deliverables: OfferDeliverable[];
          bullets: string[];
          cta: OfferCta;
          graphics?: { bannerUrl?: string };
        };
      }>;
    },
    onSuccess: (data) => {
      const o = data.offer;
      setName(o.name);
      setMetaTitle(o.metaTitle);
      setMetaDescription(o.metaDescription);
      setSections((prev) => ({
        ...prev,
        hero: {
          title: o.hero.title,
          subtitle: o.hero.subtitle,
          imageUrl: (o.hero.imageUrl ?? "").trim() || prev.hero?.imageUrl || "",
        },
        price: o.price,
        deliverables: o.deliverables.map((d) => ({
          icon: d.icon || "FileText",
          title: d.title,
          desc: d.desc,
          ...(d.imageUrl ? { imageUrl: d.imageUrl } : {}),
        })),
        bullets: o.bullets,
        cta: o.cta,
        graphics: {
          ...prev.graphics,
          bannerUrl: (o.graphics?.bannerUrl ?? "").trim() || prev.graphics?.bannerUrl || "",
        },
        iqTargeting: prev.iqTargeting,
      }));
      setAiFillOpen(false);
      setAiPrompt("");
      toast({
        title: "Form filled from AI",
        description: "Review all fields and click Save when ready. Persona targeting was not changed.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "AI fill failed", description: e.message, variant: "destructive" }),
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
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8">
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
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/offers"><ArrowLeft className="h-4 w-4 mr-2" />Back to offers</Link>
          </Button>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" onClick={() => setAiFillOpen(true)} className="flex-1 sm:flex-initial">
              <Sparkles className="h-4 w-4 mr-2" aria-hidden />
              AI fill
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 sm:flex-initial"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
          </div>
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

        <Card className="mb-6">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="text-base flex items-center gap-2 shrink-0">
                <Brain className="h-4 w-4 shrink-0" />
                Persona targeting (IQ framework)
              </CardTitle>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto justify-center"
                  onClick={() => setQuickPersonaOpen(true)}
                >
                  <UserPlus className="h-4 w-4 sm:mr-2" aria-hidden />
                  New persona
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto justify-center" asChild>
                  <Link href="/admin/ascendra-intelligence/personas/new">Full persona form</Link>
                </Button>
              </div>
            </div>
            <CardDescription>
              Link this offer to{" "}
              <Link href="/admin/ascendra-intelligence/personas" className="text-primary underline underline-offset-4">
                marketing personas
              </Link>{" "}
              so messaging stays consistent with lead magnets, scripts, and Content Studio. Use{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-4 p-0 h-auto text-sm bg-transparent border-0 cursor-pointer inline text-left"
                onClick={() => setQuickPersonaOpen(true)}
              >
                quick create
              </button>{" "}
              to add one without leaving this page. Selections are stored with this offer and are not exposed on the public offer API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {iqPersonas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No personas found. Add them under Ascendra Intelligence, then save this offer again after selecting targets.
              </p>
            ) : (
              <ul className="space-y-2">
                {iqPersonas.map((p) => {
                  const checked = sections.iqTargeting?.personaIds?.includes(p.id) ?? false;
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`iq-persona-${p.id}`}
                        checked={checked}
                        onCheckedChange={() => {
                          setSections((s) => {
                            const cur = s.iqTargeting?.personaIds ?? [];
                            const next = cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id];
                            return { ...s, iqTargeting: patchIqTargeting(s, { personaIds: next }) };
                          });
                        }}
                      />
                      <Label htmlFor={`iq-persona-${p.id}`} className="text-sm font-normal cursor-pointer leading-tight">
                        {p.displayName}{" "}
                        <span className="text-muted-foreground font-mono text-xs">({p.id})</span>
                      </Label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
              <div className="space-y-2">
                <Label>Time in business (reader)</Label>
                <Select
                  value={sections.iqTargeting?.audienceTenureBand ?? "__none__"}
                  onValueChange={(v) =>
                    setSections((s) => ({
                      ...s,
                      iqTargeting: patchIqTargeting(s, {
                        audienceTenureBand: v === "__none__" ? null : (v as AudienceTenureBand),
                      }),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional — improves grading" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="pre_launch">Pre-launch / idea stage</SelectItem>
                    <SelectItem value="under_2_years">Under 2 years operating</SelectItem>
                    <SelectItem value="two_to_five_years">2–5 years in business</SelectItem>
                    <SelectItem value="five_plus_years">5+ years / scaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Investment in their vision</Label>
                <Select
                  value={sections.iqTargeting?.audienceVisionInvestment ?? "__none__"}
                  onValueChange={(v) =>
                    setSections((s) => ({
                      ...s,
                      iqTargeting: patchIqTargeting(s, {
                        audienceVisionInvestment: v === "__none__" ? null : (v as AudienceVisionInvestment),
                      }),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional — improves grading" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    <SelectItem value="exploring">Exploring / early interest</SelectItem>
                    <SelectItem value="committed">Committed / actively building</SelectItem>
                    <SelectItem value="all_in">All-in / high conviction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        {/* Content grading */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Content grading</CardTitle>
            <CardDescription>
              SEO, design, copy, and — when persona targeting or audience parameters are set — persona/audience context (IQ language overlap, tenure, vision investment).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {offer?.grading && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span><strong>SEO:</strong> {offer.grading.seoScore}/100</span>
                  <span><strong>Design:</strong> {offer.grading.designScore}/100</span>
                  <span><strong>Copy:</strong> {offer.grading.copyScore}/100</span>
                  {offer.grading.personaContextScore != null && (
                    <span><strong>Persona & audience:</strong> {offer.grading.personaContextScore}/100</span>
                  )}
                  <span><strong>Grade:</strong> {offer.grading.overallGrade}</span>
                </div>
                {offer.grading.gradedAt && (
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>Graded {new Date(offer.grading.gradedAt).toLocaleString()}</p>
                )}
                {/* Targets & measured — confirms grading accuracy for diagnostics/audits */}
                {offer.grading.targets && offer.grading.measured && (
                  <div className="border-t border-border/60 pt-3 space-y-3">
                    <p className="text-xs font-medium text-foreground">Targets & your content (accuracy)</p>
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      {offer.grading.targets.seo && offer.grading.measured.seo && (
                        <>
                          <div>Meta title: target {offer.grading.targets.seo.metaTitleMin}–{offer.grading.targets.seo.metaTitleMax} chars → yours: {offer.grading.measured.seo.metaTitleLength}</div>
                          <div>Meta description: target {offer.grading.targets.seo.metaDescMin}–{offer.grading.targets.seo.metaDescMax} chars → yours: {offer.grading.measured.seo.metaDescLength}</div>
                        </>
                      )}
                      {offer.grading.targets.design && offer.grading.measured.design && (
                        <>
                          <div>Hero: title {offer.grading.measured.design.hasHeroTitle ? "✓" : "✗"}, subtitle {offer.grading.measured.design.hasHeroSubtitle ? "✓" : "✗"}, image {offer.grading.measured.design.hasHeroImage ? "✓" : "✗"}</div>
                          <div>Deliverables: {offer.grading.measured.design.deliverableCount} (with desc: {offer.grading.measured.design.deliverableWithDescCount})</div>
                        </>
                      )}
                      {offer.grading.targets.copy && offer.grading.measured.copy && (
                        <div>CTA: button {offer.grading.measured.copy.hasCtaButton ? "✓" : "✗"}, link {offer.grading.measured.copy.hasCtaHref ? "✓" : "✗"} · Bullets: {offer.grading.measured.copy.bulletCount} (min {offer.grading.targets.copy.minBullets}) · Subtitle: {offer.grading.measured.copy.heroSubtitleLength} chars (min {offer.grading.targets.copy.heroSubtitleMinChars})</div>
                      )}
                      {offer.grading.targets.personaContext && offer.grading.measured.personaContext && (
                        <div>
                          Persona fit: token overlap {Math.round((offer.grading.measured.personaContext.overlapRatio ?? 0) * 100)}% ({offer.grading.measured.personaContext.personaTokenHits}/{offer.grading.measured.personaContext.personaTokenUniverse} IQ tokens found in offer) · Personas scored: {offer.grading.measured.personaContext.personaCount}
                          {offer.grading.measured.personaContext.audienceTenureBand
                            ? ` · Tenure band: ${offer.grading.measured.personaContext.audienceTenureBand}`
                            : ""}
                          {offer.grading.measured.personaContext.audienceVisionInvestment
                            ? ` · Vision: ${offer.grading.measured.personaContext.audienceVisionInvestment}`
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(offer.grading.feedback?.seo?.length ||
                  offer.grading.feedback?.design?.length ||
                  offer.grading.feedback?.copy?.length ||
                  offer.grading.feedback?.persona?.length) ? (
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    {[
                      ...(offer.grading.feedback?.seo ?? []),
                      ...(offer.grading.feedback?.design ?? []),
                      ...(offer.grading.feedback?.copy ?? []),
                      ...(offer.grading.feedback?.persona ?? []),
                    ]
                      .slice(0, 10)
                      .map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                  </ul>
                ) : null}
              </div>
            )}
            <Button variant="outline" onClick={() => gradeMutation.mutate()} disabled={gradeMutation.isPending || !offer}>
              {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4 mr-2" />}
              Grade content
            </Button>
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

        <Dialog open={aiFillOpen} onOpenChange={setAiFillOpen}>
          <DialogContent className="w-[min(100%,calc(100vw-2rem))] max-w-lg max-h-[min(92dvh,calc(100dvh-1rem))] overflow-y-auto top-4 translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0" aria-hidden />
                AI fill offer
              </DialogTitle>
              <DialogDescription>
                Describe the offer, audience, pricing, and what they get. The model fills this page&apos;s fields.
                Persona targeting (IQ) is never changed. Empty hero/banner image URLs keep your current URLs.
                Requires <code className="text-xs bg-muted px-1 rounded">OPENAI_API_KEY</code>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="offer-ai-prompt">Prompt</Label>
                <Textarea
                  id="offer-ai-prompt"
                  rows={6}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='e.g. "Premium website redesign for local home services, $8k–$15k, 4-week timeline, includes discovery, Figma, Webflow build, 30-day support…"'
                  className="resize-y min-h-[140px] text-sm"
                />
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
                <Checkbox
                  id="offer-ai-context"
                  checked={aiIncludeCurrent}
                  onCheckedChange={(v) => setAiIncludeCurrent(v === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label htmlFor="offer-ai-context" className="text-sm font-medium leading-snug cursor-pointer">
                    Include current form as context
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When checked, the model sees your existing copy and can refine it. Uncheck for a fresh draft from the prompt only.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setAiFillOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!aiPrompt.trim() || aiFillMutation.isPending}
                onClick={() =>
                  aiFillMutation.mutate({ prompt: aiPrompt.trim(), includeCurrent: aiIncludeCurrent })
                }
              >
                {aiFillMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                    Generate &amp; apply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <QuickCreatePersonaModal
          open={quickPersonaOpen}
          onOpenChange={setQuickPersonaOpen}
          onCreated={(p) => {
            setSections((s) => {
              const cur = s.iqTargeting?.personaIds ?? [];
              if (cur.includes(p.id)) return s;
              return { ...s, iqTargeting: patchIqTargeting(s, { personaIds: [...cur, p.id] }) };
            });
          }}
        />
      </div>
    </div>
  );
}
