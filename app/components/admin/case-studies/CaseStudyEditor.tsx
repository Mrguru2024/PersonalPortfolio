"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ArrowUp, ArrowDown, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CASE_STUDY_PERSONAS,
  CASE_STUDY_SYSTEMS,
  computeCaseStudyCompleteness,
  emptyCaseStudySections,
  slugifyCaseStudy,
} from "@/lib/revenue-system/caseStudy";
import type { CaseStudyBlock, CaseStudyFormats, CaseStudySectionContent } from "@shared/schema";

const SECTION_KEYS: Array<keyof CaseStudySectionContent> = [
  "hero",
  "overview",
  "problem",
  "diagnosis",
  "solution",
  "results",
  "visualProof",
  "takeaways",
  "cta",
];

const BLOCK_TYPES: CaseStudyBlock["type"][] = [
  "heading",
  "image",
  "gallery",
  "before_after",
  "metrics_card",
  "testimonial",
  "cta_block",
];

interface EditorState {
  id?: number;
  title: string;
  slug: string;
  subtitle: string;
  summary: string;
  persona: string;
  recommendedSystem: string;
  publishState: string;
  featured: boolean;
  sections: CaseStudySectionContent;
  blocks: CaseStudyBlock[];
  formats: CaseStudyFormats;
  ctaLabel: string;
  ctaHref: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  noIndex: boolean;
}

const EMPTY_FORMATS: CaseStudyFormats = {
  full: "",
  short: "",
  social: "",
  email: "",
  proposal: "",
  landingProof: "",
};

const INITIAL_STATE: EditorState = {
  title: "",
  slug: "",
  subtitle: "",
  summary: "",
  persona: "operators",
  recommendedSystem: "revenue_system",
  publishState: "draft",
  featured: false,
  sections: emptyCaseStudySections(),
  blocks: [],
  formats: EMPTY_FORMATS,
  ctaLabel: "",
  ctaHref: "/revenue-diagnostic",
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  noIndex: true,
};

function makeBlock(type: CaseStudyBlock["type"]): CaseStudyBlock {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    title: "",
    content: "",
  };
}

export function CaseStudyEditor({ caseStudyId }: { caseStudyId?: number }) {
  const [state, setState] = useState<EditorState>(INITIAL_STATE);
  const [loading, setLoading] = useState(Boolean(caseStudyId));
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [sectionForAi, setSectionForAi] = useState<keyof CaseStudySectionContent>("problem");
  const router = useRouter();
  const { toast } = useToast();

  const completeness = useMemo(
    () =>
      computeCaseStudyCompleteness({
        sections: state.sections,
        blocks: state.blocks,
        ctaLabel: state.ctaLabel,
        ctaHref: state.ctaHref,
      }),
    [state.blocks, state.ctaHref, state.ctaLabel, state.sections],
  );

  useEffect(() => {
    if (!caseStudyId) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await apiRequest("GET", `/api/admin/case-studies/${caseStudyId}`);
        const payload = await response.json();
        if (!active) return;
        const item = payload.caseStudy;
        setState({
          id: item.id,
          title: item.title ?? "",
          slug: item.slug ?? "",
          subtitle: item.subtitle ?? "",
          summary: item.summary ?? "",
          persona: item.persona ?? "operators",
          recommendedSystem: item.recommendedSystem ?? "revenue_system",
          publishState: item.publishState ?? "draft",
          featured: Boolean(item.featured),
          sections: { ...emptyCaseStudySections(), ...(item.sections ?? {}) },
          blocks: Array.isArray(item.blocks) ? item.blocks : [],
          formats: { ...EMPTY_FORMATS, ...(item.formats ?? {}) },
          ctaLabel: item.ctaLabel ?? "",
          ctaHref: item.ctaHref ?? "",
          metaTitle: item.metaTitle ?? "",
          metaDescription: item.metaDescription ?? "",
          ogImage: item.ogImage ?? "",
          noIndex: Boolean(item.noIndex),
        });
      } catch (error) {
        console.error(error);
        toast({ title: "Failed to load case study", variant: "destructive" });
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [caseStudyId, toast]);

  function setField<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function setSection(key: keyof CaseStudySectionContent, value: string) {
    setState((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: value,
      },
    }));
  }

  function updateBlock(id: string, patch: Partial<CaseStudyBlock>) {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    }));
  }

  async function saveCaseStudy() {
    if (!state.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: state.title.trim(),
        slug: state.slug.trim() || slugifyCaseStudy(state.title),
        subtitle: state.subtitle || null,
        summary: state.summary,
        persona: state.persona,
        recommendedSystem: state.recommendedSystem,
        publishState: state.publishState,
        featured: state.featured,
        sections: state.sections,
        blocks: state.blocks,
        formats: state.formats,
        ctaLabel: state.ctaLabel || null,
        ctaHref: state.ctaHref || null,
        metaTitle: state.metaTitle || null,
        metaDescription: state.metaDescription || null,
        ogImage: state.ogImage || null,
        noIndex: state.noIndex,
      };

      if (state.id) {
        const response = await apiRequest("PATCH", `/api/admin/case-studies/${state.id}`, payload);
        const result = await response.json();
        setState((prev) => ({ ...prev, id: result.caseStudy.id }));
      } else {
        const response = await apiRequest("POST", "/api/admin/case-studies", payload);
        const result = await response.json();
        const newId = Number(result.caseStudy?.id);
        if (!Number.isNaN(newId)) {
          setState((prev) => ({ ...prev, id: newId }));
          router.replace(`/admin/case-studies/${newId}`);
        }
      }
      toast({ title: "Saved", description: "Case study updated." });
    } catch (error: unknown) {
      console.error(error);
      toast({ title: "Save failed", description: (error as Error)?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function runAiAction(action: string) {
    setAiBusy(true);
    try {
      const response = await apiRequest("POST", "/api/admin/case-studies/ai", {
        action,
        title: state.title || "Case Study",
        summary: state.summary,
        persona: state.persona,
        system: state.recommendedSystem,
        sectionKey: sectionForAi,
        sectionContent: state.sections[sectionForAi],
        sections: state.sections,
        ctaLabel: state.ctaLabel,
        ctaHref: state.ctaHref,
      });
      const payload = await response.json();
      const output = payload.output ?? {};

      if (output.sections) {
        setState((prev) => ({
          ...prev,
          sections: { ...prev.sections, ...output.sections },
        }));
      }
      if (output.content) {
        if (action === "generate_social") {
          setState((prev) => ({ ...prev, formats: { ...prev.formats, social: output.content } }));
        } else if (action === "generate_email") {
          setState((prev) => ({ ...prev, formats: { ...prev.formats, email: output.content } }));
        } else if (action === "generate_proposal") {
          setState((prev) => ({ ...prev, formats: { ...prev.formats, proposal: output.content } }));
        } else {
          setSection(sectionForAi, output.content);
        }
      }
      if (output.formats) {
        setState((prev) => ({
          ...prev,
          formats: { ...prev.formats, ...output.formats },
        }));
      }
      toast({ title: "AI action complete" });
    } catch (error) {
      console.error(error);
      toast({ title: "AI action failed", description: (error as Error)?.message, variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  }

  async function uploadImage(onUrl: (url: string) => void) {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Upload failed");
        }
        onUrl(payload.url);
        toast({ title: "Image uploaded" });
      } catch (error) {
        console.error(error);
        toast({ title: "Upload failed", description: (error as Error)?.message, variant: "destructive" });
      }
    };
    picker.click();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{state.id ? "Edit Case Study" : "Create Case Study"}</h1>
          <p className="text-sm text-muted-foreground">Build proof assets, publish flows, and conversion CTA paths.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Completeness: {completeness}%</div>
          <Button onClick={() => void saveCaseStudy()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={state.title}
              onChange={(event) => setField("title", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={state.slug}
              onChange={(event) => setField("slug", event.target.value)}
              placeholder="auto-generated-if-empty"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={state.subtitle}
              onChange={(event) => setField("subtitle", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={state.summary}
              onChange={(event) => setField("summary", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona">Persona</Label>
            <select
              id="persona"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={state.persona}
              onChange={(event) => setField("persona", event.target.value)}
            >
              {CASE_STUDY_PERSONAS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system">Recommended System</Label>
            <select
              id="system"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={state.recommendedSystem}
              onChange={(event) => setField("recommendedSystem", event.target.value)}
            >
              {CASE_STUDY_SYSTEMS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishState">Publish State</Label>
            <select
              id="publishState"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={state.publishState}
              onChange={(event) => setField("publishState", event.target.value)}
            >
              <option value="draft">draft</option>
              <option value="preview">preview</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="featured">Featured</Label>
            <select
              id="featured"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={state.featured ? "yes" : "no"}
              onChange={(event) => setField("featured", event.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Content Tools</CardTitle>
          <CardDescription>Generate draft and multi-format outputs. All generated content stays editable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void runAiAction("generate_draft")} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Draft
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("improve_section")} disabled={aiBusy}>
              Improve Section
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("rewrite_sales")} disabled={aiBusy}>
              Rewrite for Sales
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("generate_social")} disabled={aiBusy}>
              Generate Social Version
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("generate_email")} disabled={aiBusy}>
              Generate Email Version
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("generate_proposal")} disabled={aiBusy}>
              Generate Proposal Snippet
            </Button>
            <Button variant="outline" onClick={() => void runAiAction("generate_formats")} disabled={aiBusy}>
              Generate Multi-Format Set
            </Button>
          </div>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="sectionForAi">Section for improve/rewrite</Label>
            <select
              id="sectionForAi"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={sectionForAi}
              onChange={(event) => setSectionForAi(event.target.value as keyof CaseStudySectionContent)}
            >
              {SECTION_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case Study Sections</CardTitle>
          <CardDescription>Hero, overview, problem, diagnosis, solution, results, visual proof, takeaways, CTA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SECTION_KEYS.map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`section-${key}`} className="capitalize">
                {key}
              </Label>
              <Textarea
                id={`section-${key}`}
                value={state.sections[key]}
                onChange={(event) => setSection(key, event.target.value)}
                className="min-h-[96px]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rich Blocks</CardTitle>
          <CardDescription>Add headings, images, galleries, before/after, metrics, testimonials, and CTA blocks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, blocks: [...prev.blocks, makeBlock(type)] }))}
              >
                <Plus className="h-4 w-4 mr-1" />
                {type}
              </Button>
            ))}
          </div>

          {state.blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocks yet.</p>
          ) : (
            state.blocks.map((block, index) => (
              <Card key={block.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {block.type} #{index + 1}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setState((prev) => {
                            if (index === 0) return prev;
                            const next = [...prev.blocks];
                            [next[index - 1], next[index]] = [next[index], next[index - 1]];
                            return { ...prev, blocks: next };
                          })
                        }
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setState((prev) => {
                            if (index >= prev.blocks.length - 1) return prev;
                            const next = [...prev.blocks];
                            [next[index + 1], next[index]] = [next[index], next[index + 1]];
                            return { ...prev, blocks: next };
                          })
                        }
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            blocks: prev.blocks.filter((item) => item.id !== block.id),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={block.title ?? ""}
                      onChange={(event) => updateBlock(block.id, { title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={block.imageUrl ?? ""}
                        onChange={(event) => updateBlock(block.id, { imageUrl: event.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void uploadImage((url) => updateBlock(block.id, { imageUrl: url }))}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Content</Label>
                    <Textarea
                      value={block.content ?? ""}
                      onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                    />
                  </div>
                  {block.type === "before_after" && (
                    <>
                      <div className="space-y-2">
                        <Label>Before</Label>
                        <Input
                          value={block.beforeValue ?? ""}
                          onChange={(event) => updateBlock(block.id, { beforeValue: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>After</Label>
                        <Input
                          value={block.afterValue ?? ""}
                          onChange={(event) => updateBlock(block.id, { afterValue: event.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {block.type === "metrics_card" && (
                    <>
                      <div className="space-y-2">
                        <Label>Metric Label</Label>
                        <Input
                          value={block.metricLabel ?? ""}
                          onChange={(event) => updateBlock(block.id, { metricLabel: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Metric Value</Label>
                        <Input
                          value={block.metricValue ?? ""}
                          onChange={(event) => updateBlock(block.id, { metricValue: event.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {block.type === "testimonial" && (
                    <>
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input
                          value={block.testimonialAuthor ?? ""}
                          onChange={(event) => updateBlock(block.id, { testimonialAuthor: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={block.testimonialRole ?? ""}
                          onChange={(event) => updateBlock(block.id, { testimonialRole: event.target.value })}
                        />
                      </div>
                    </>
                  )}
                  {block.type === "cta_block" && (
                    <>
                      <div className="space-y-2">
                        <Label>CTA Label</Label>
                        <Input
                          value={block.ctaLabel ?? ""}
                          onChange={(event) => updateBlock(block.id, { ctaLabel: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CTA Href</Label>
                        <Input
                          value={block.ctaHref ?? ""}
                          onChange={(event) => updateBlock(block.id, { ctaHref: event.target.value })}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO + CTA</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>CTA Label</Label>
            <Input value={state.ctaLabel} onChange={(event) => setField("ctaLabel", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA Href</Label>
            <Input value={state.ctaHref} onChange={(event) => setField("ctaHref", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta title</Label>
            <Input value={state.metaTitle} onChange={(event) => setField("metaTitle", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta description</Label>
            <Textarea
              value={state.metaDescription}
              onChange={(event) => setField("metaDescription", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Open graph image URL</Label>
            <div className="flex gap-2">
              <Input value={state.ogImage} onChange={(event) => setField("ogImage", event.target.value)} />
              <Button variant="outline" size="icon" onClick={() => void uploadImage((url) => setField("ogImage", url))}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Index control</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={state.noIndex ? "noindex" : "index"}
              onChange={(event) => setField("noIndex", event.target.value === "noindex")}
            >
              <option value="index">Allow indexing</option>
              <option value="noindex">No index</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-format Outputs</CardTitle>
          <CardDescription>Editable outputs for full case study, short, social, email, proposal, and landing proof block.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(state.formats).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key}</Label>
              <Textarea
                value={value}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    formats: { ...prev.formats, [key]: event.target.value },
                  }))
                }
                className="min-h-[96px]"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />
      <div className="flex justify-end gap-3 pb-10">
        <Button variant="outline" onClick={() => router.push("/admin/case-studies")}>
          Back to list
        </Button>
        <Button onClick={() => void saveCaseStudy()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save case study
        </Button>
      </div>
    </div>
  );
}
