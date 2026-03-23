"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Save,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["qualification", "discovery", "proposal", "follow_up"];
const SERVICE_TYPES = ["web_design", "funnel_optimization", "branding", "content_seo", "general"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function NewPlaybookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([""]);
  const [qualificationRules, setQualificationRules] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [proposalRequirements, setProposalRequirements] = useState("");
  const [followUpGuidance, setFollowUpGuidance] = useState("");
  const [active, setActive] = useState(true);
  const [platformTips, setPlatformTips] = useState<string[]>([]);

  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/crm/playbooks/ai-generate", {
        title: title || "Sales playbook",
        category: category || null,
        serviceType: serviceType || null,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: (data: {
      description?: string;
      checklistItems?: string[];
      qualificationRules?: string;
      redFlags?: string;
      proposalRequirements?: string;
      followUpGuidance?: string;
      platformTips?: string[];
    }) => {
      if (data.description != null) setDescription(data.description);
      if (Array.isArray(data.checklistItems) && data.checklistItems.length > 0) {
        setChecklistItems(data.checklistItems.map((s) => s.trim()).filter(Boolean).concat([""]));
      }
      if (data.qualificationRules != null) setQualificationRules(data.qualificationRules);
      if (data.redFlags != null) setRedFlags(data.redFlags);
      if (data.proposalRequirements != null) setProposalRequirements(data.proposalRequirements);
      if (data.followUpGuidance != null) setFollowUpGuidance(data.followUpGuidance);
      if (Array.isArray(data.platformTips) && data.platformTips.length > 0) {
        setPlatformTips(data.platformTips);
      }
      toast({ title: "AI content generated", description: "Review and edit as needed, then save." });
    },
    onError: (e: Error) => toast({ title: "AI generation failed", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/crm/playbooks", {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        category: category || null,
        serviceType: serviceType || null,
        description: description.trim() || null,
        checklistItems: checklistItems.map((s) => s.trim()).filter(Boolean),
        qualificationRules: qualificationRules.trim() || null,
        redFlags: redFlags.trim() || null,
        proposalRequirements: proposalRequirements.trim() || null,
        followUpGuidance: followUpGuidance.trim() || null,
        active,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: (playbook: { id: number }) => {
      toast({ title: "Playbook created" });
      router.push(`/admin/crm/playbooks/${playbook.id}`);
    },
    onError: (e: Error) => toast({ title: "Failed to create playbook", description: e.message, variant: "destructive" }),
  });

  const addChecklistItem = () => setChecklistItems((prev) => [...prev, ""]);
  const setChecklistItem = (i: number, v: string) => {
    setChecklistItems((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };
  const removeChecklistItem = (i: number) => {
    setChecklistItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slug || slug === slugify(title)) setSlug(slugify(v));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm/playbooks"><ArrowLeft className="h-4 w-4 mr-2" />Back to playbooks</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> New playbook</CardTitle>
            <CardDescription>Add a reusable sales playbook. Use &quot;Generate with AI&quot; to draft content from the title and type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Qualify web design leads"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Auto from title"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => aiGenerateMutation.mutate()}
                disabled={aiGenerateMutation.isPending}
              >
                {aiGenerateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate with AI
              </Button>
              <span className="text-xs text-muted-foreground">Fills description, checklist, rules, guidance, and platform usage tips from title/category.</span>
            </div>

            {platformTips.length > 0 && (
              <Alert className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <AlertTitle>How to use this playbook in the platform</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {platformTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When to use this playbook…"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label>Checklist items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addChecklistItem}><Plus className="h-4 w-4 mr-1" />Add</Button>
              </div>
              <ul className="space-y-2">
                {checklistItems.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => setChecklistItem(i, e.target.value)}
                      placeholder="e.g. Confirm budget range"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(i)} aria-label="Remove"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label>Qualification rules</Label>
              <Textarea
                value={qualificationRules}
                onChange={(e) => setQualificationRules(e.target.value)}
                placeholder="What must be true to qualify…"
                rows={2}
              />
            </div>
            <div>
              <Label>Red flags</Label>
              <Textarea
                value={redFlags}
                onChange={(e) => setRedFlags(e.target.value)}
                placeholder="Warning signs to watch for…"
                rows={2}
              />
            </div>
            <div>
              <Label>Proposal requirements</Label>
              <Textarea
                value={proposalRequirements}
                onChange={(e) => setProposalRequirements(e.target.value)}
                placeholder="What must be confirmed before proposing…"
                rows={2}
              />
            </div>
            <div>
              <Label>Follow-up guidance</Label>
              <Textarea
                value={followUpGuidance}
                onChange={(e) => setFollowUpGuidance(e.target.value)}
                placeholder="How to follow up…"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="active">Active (visible in list)</Label>
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Create playbook
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
