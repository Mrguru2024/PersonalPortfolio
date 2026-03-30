"use client";

import type { EditorialStrategyMeta } from "@shared/editorialStrategyMeta";
import type { ContentStrategyWorkflowConfig } from "@shared/contentStrategyWorkflowConfig";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ContentStrategyBriefPanelProps {
  value: EditorialStrategyMeta;
  onChange: (next: EditorialStrategyMeta) => void;
  /** Merged workflow (defaults + optional JSON). */
  workflow: ContentStrategyWorkflowConfig | null;
  className?: string;
}

export function ContentStrategyBriefPanel({
  value,
  onChange,
  workflow,
  className,
}: ContentStrategyBriefPanelProps) {
  const pillars = workflow?.pillars ?? [];
  const formats = workflow?.contentFormats ?? [];
  const repurpose = workflow?.repurposeChannels ?? [];

  function patch(p: Partial<EditorialStrategyMeta>) {
    onChange({ ...value, ...p });
  }

  const intentVal = value.searchIntent ? value.searchIntent : "__none__";
  const pillarVal = value.contentPillarId?.trim() ? value.contentPillarId : "__none__";
  const formatVal = value.contentFormat?.trim() ? value.contentFormat : "__none__";
  const lifecycleVal = value.lifecycle ?? "__none__";

  return (
    <div className={cn("space-y-4 rounded-lg border border-border/60 bg-muted/20 p-3", className)}>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Editorial brief: complements funnel stage, personas, and CTA on this row. Optional field mix used by professional
        content teams (pillar, intent, keyword, repurposing).
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Content pillar</Label>
          <Select
            value={pillarVal}
            onValueChange={(v) => patch({ contentPillarId: v === "__none__" ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select pillar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {pillars.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Search intent</Label>
          <Select
            value={intentVal}
            onValueChange={(v) =>
              patch({
                searchIntent:
                  v === "__none__" ? undefined : (v as EditorialStrategyMeta["searchIntent"]),
              })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Intent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              <SelectItem value="informational">Informational</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="navigational">Navigational</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Primary keyword (SEO / discovery)</Label>
        <Input
          className="h-9 text-sm"
          value={value.primaryKeyword ?? ""}
          placeholder="e.g. fractional CMO for SaaS"
          onChange={(e) => patch({ primaryKeyword: e.target.value || undefined })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Primary format</Label>
          <Select
            value={formatVal}
            onValueChange={(v) => patch({ contentFormat: v === "__none__" ? undefined : v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              {formats.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lifecycle</Label>
          <Select
            value={lifecycleVal}
            onValueChange={(v) =>
              patch({ lifecycle: v === "__none__" ? undefined : (v as EditorialStrategyMeta["lifecycle"]) })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Not set</SelectItem>
              <SelectItem value="evergreen">Evergreen</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
              <SelectItem value="timely">Timely / news</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Success KPI (one line)</Label>
        <Input
          className="h-9 text-sm"
          value={value.successKpi ?? ""}
          placeholder="e.g. trial signups from this post"
          onChange={(e) => patch({ successKpi: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Hook / angle</Label>
        <Textarea
          className="text-sm min-h-[72px] resize-y"
          value={value.hookAngle ?? ""}
          placeholder="What promise or tension does this slot open with?"
          onChange={(e) => patch({ hookAngle: e.target.value || undefined })}
        />
      </div>

      {repurpose.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-xs">Repurpose targets</Label>
          <p className="text-[11px] text-muted-foreground">Plan derivatives from one primary asset.</p>
          <div className="flex flex-wrap gap-2">
            {repurpose.map((ch) => {
              const set = new Set(value.repurposeTargets ?? []);
              const on = set.has(ch.id);
              return (
                <label
                  key={ch.id}
                  className="flex items-center gap-2 text-xs border rounded-md px-2 py-1.5 cursor-pointer bg-background/80"
                >
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={on}
                    onChange={(e) => {
                      const next = new Set(value.repurposeTargets ?? []);
                      if (e.target.checked) next.add(ch.id);
                      else next.delete(ch.id);
                      patch({ repurposeTargets: next.size ? [...next] : undefined });
                    }}
                  />
                  <span>{ch.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs">Internal notes</Label>
        <Textarea
          className="text-sm min-h-[56px] resize-y"
          value={value.internalNotes ?? ""}
          placeholder="Briefing for approvers or AI — not public copy"
          onChange={(e) => patch({ internalNotes: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
