"use client";

import { useMemo } from "react";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRM_PIPELINE_STAGES, getPipelineStageLabel } from "@/lib/crm-pipeline-stages";

const LIFECYCLE_OPTIONS = ["cold", "warm", "qualified", "sales_ready"];
const INTENT_OPTIONS = ["low_intent", "moderate_intent", "high_intent", "hot_lead"];

const ANY = "__any__";

function sel(v: string | undefined): string {
  return v && String(v).trim() !== "" ? String(v) : ANY;
}

function out(v: string): string | undefined {
  return v === ANY || !v.trim() ? undefined : v;
}

export interface CommAudienceSegmentBuilderProps {
  value: CommSegmentFilters;
  onChange: (next: CommSegmentFilters) => void;
  /** Optional saved list merges on the server over these fields when creating/previewing. */
  savedListId: string;
  onSavedListIdChange: (id: string) => void;
  savedLists: { id: number; name: string }[];
}

export function CommAudienceSegmentBuilder({
  value,
  onChange,
  savedListId,
  onSavedListIdChange,
  savedLists,
}: CommAudienceSegmentBuilderProps) {
  const patch = (partial: Partial<CommSegmentFilters>) => {
    onChange({ ...value, ...partial });
  };

  const tagsStr = useMemo(() => (value.tags ?? []).join(", "), [value.tags]);

  const setTagsFromString = (s: string) => {
    const tags = s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch({ tags: tags.length ? tags : undefined });
  };

  const contactIdsStr = useMemo(() => (value.contactIds ?? []).join(", "), [value.contactIds]);

  const setContactIdsFromString = (s: string) => {
    const ids = s
      .split(/[\s,]+/)
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const unique = [...new Set(ids)];
    patch({ contactIds: unique.length ? unique : undefined });
  };

  const bookedCallSel =
    value.bookedCall === true ? "yes" : value.bookedCall === false ? "no" : ANY;

  const researchSel =
    value.hasResearch === true ? "yes" : value.hasResearch === false ? "no" : ANY;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4 dark:bg-muted/10">
      <div className="space-y-2">
        <Label>Start from saved list (optional)</Label>
        <Select value={savedListId || ANY} onValueChange={(v) => onSavedListIdChange(v === ANY ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="None — build audience below" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>None — use only the rules below</SelectItem>
            {savedLists.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          If you pick a list, its rules are combined with the fields below (below wins when both set).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id="seg-dnc"
          checked={value.excludeDoNotContact !== false}
          onCheckedChange={(c) => patch({ excludeDoNotContact: c !== false })}
        />
        <Label htmlFor="seg-dnc" className="cursor-pointer font-medium">
          Exclude do-not-contact leads
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-contact-ids">Specific contact IDs (optional)</Label>
        <Input
          id="seg-contact-ids"
          value={contactIdsStr}
          onChange={(e) => setContactIdsFromString(e.target.value)}
          placeholder="e.g. 12, 48, 90 — only these people if set"
        />
        <p className="text-xs text-muted-foreground">
          When IDs are listed, the campaign targets only those contacts (other filters still apply).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={sel(value.type)} onValueChange={(v) => patch({ type: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={sel(value.status)} onValueChange={(v) => patch({ status: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Intent level</Label>
          <Select value={sel(value.intentLevel)} onValueChange={(v) => patch({ intentLevel: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {INTENT_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pipeline stage (open deal)</Label>
          <Select value={sel(value.pipelineStage)} onValueChange={(v) => patch({ pipelineStage: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {CRM_PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {getPipelineStageLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Lifecycle stage</Label>
          <Select value={sel(value.lifecycleStage)} onValueChange={(v) => patch({ lifecycleStage: out(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {LIFECYCLE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Booked call</Label>
          <Select
            value={bookedCallSel}
            onValueChange={(v) =>
              patch({
                bookedCall: v === "yes" ? true : v === "no" ? false : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Has research profile (account)</Label>
          <Select
            value={researchSel}
            onValueChange={(v) =>
              patch({
                hasResearch: v === "yes" ? true : v === "no" ? false : undefined,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Days since last activity (minimum)</Label>
          <Input
            inputMode="numeric"
            value={value.noContactSinceDays != null ? String(value.noContactSinceDays) : ""}
            onChange={(e) => {
              const t = e.target.value.trim();
              if (t === "") {
                patch({ noContactSinceDays: undefined });
                return;
              }
              const n = Number.parseInt(t, 10);
              patch({ noContactSinceDays: Number.isFinite(n) && n >= 0 ? n : undefined });
            }}
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id="seg-tasks"
          checked={!!value.hasOpenTasks}
          onCheckedChange={(c) => patch({ hasOpenTasks: c === true ? true : undefined })}
        />
        <Label htmlFor="seg-tasks" className="cursor-pointer">
          Only leads with open CRM tasks
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-source">Source (exact match)</Label>
        <Input
          id="seg-source"
          value={value.source ?? ""}
          onChange={(e) => patch({ source: e.target.value.trim() || undefined })}
          placeholder="e.g. website, referral"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seg-tags">Tags (comma-separated, any match)</Label>
        <Input id="seg-tags" value={tagsStr} onChange={(e) => setTagsFromString(e.target.value)} placeholder="vip, newsletter" />
      </div>

      <div className="rounded-md border border-border/80 bg-card/50 p-3 space-y-3">
        <p className="text-sm font-medium">Match leads by UTM (optional)</p>
        <p className="text-xs text-muted-foreground">
          These narrow the audience to contacts whose stored UTM fields match — separate from link tracking UTMs below.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">UTM source</Label>
            <Input
              value={value.utmSource ?? ""}
              onChange={(e) => patch({ utmSource: e.target.value.trim() || undefined })}
              placeholder="google"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">UTM medium</Label>
            <Input
              value={value.utmMedium ?? ""}
              onChange={(e) => patch({ utmMedium: e.target.value.trim() || undefined })}
              placeholder="cpc"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">UTM campaign</Label>
            <Input
              value={value.utmCampaign ?? ""}
              onChange={(e) => patch({ utmCampaign: e.target.value.trim() || undefined })}
              placeholder="spring_sale"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Marketing persona ID</Label>
          <Input
            value={value.personaId ?? ""}
            onChange={(e) => patch({ personaId: e.target.value.trim() || undefined })}
            placeholder="Persona id from Offer + Persona IQ"
          />
        </div>
        <div className="space-y-2">
          <Label>Service interest contains</Label>
          <Input
            value={value.serviceInterestContains ?? ""}
            onChange={(e) => patch({ serviceInterestContains: e.target.value.trim() || undefined })}
            placeholder="Keyword in service interest / notes"
          />
        </div>
      </div>
    </div>
  );
}
