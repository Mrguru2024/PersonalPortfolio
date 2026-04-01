"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MetricTooltip } from "@/components/aee/MetricTooltip";
import { cn } from "@/lib/utils";

export type VariantDraft = {
  key: string;
  name: string;
  allocationWeight: number;
  isControl: boolean;
};

export interface VariantBuilderProps {
  variants: VariantDraft[];
  onChange: (v: VariantDraft[]) => void;
}

function trafficPercents(variants: VariantDraft[]): number[] {
  const raw = variants.map((v) => (Number.isFinite(v.allocationWeight) && v.allocationWeight > 0 ? v.allocationWeight : 1));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((w) => (w / sum) * 100);
}

export function VariantBuilder({ variants, onChange }: VariantBuilderProps) {
  const percents = trafficPercents(variants);

  const update = (i: number, patch: Partial<VariantDraft>) => {
    const next = variants.map((row, j) => (j === i ? { ...row, ...patch } : row));
    onChange(next);
  };

  const setControlExclusive = (i: number, checked: boolean) => {
    if (checked) {
      onChange(variants.map((row, j) => ({ ...row, isControl: j === i })));
      return;
    }
    const next = variants.map((row, j) => (j === i ? { ...row, isControl: false } : row));
    if (!next.some((v) => v.isControl)) {
      next[0] = { ...next[0]!, isControl: true };
    }
    onChange(next);
  };

  const add = () => {
    const n = variants.length + 1;
    const letter = String.fromCharCode(96 + n); // b, c, ...
    onChange([
      ...variants,
      {
        key: `variant_${letter}`,
        name: `Version ${n}`,
        allocationWeight: 1,
        isControl: false,
      },
    ]);
  };

  const remove = (i: number) => {
    if (variants.length <= 2) return;
    const filtered = variants.filter((_, j) => j !== i);
    if (!filtered.some((v) => v.isControl)) {
      filtered[0] = { ...filtered[0]!, isControl: true };
    }
    onChange(filtered);
  };

  const splitEven = () => {
    onChange(variants.map((v) => ({ ...v, allocationWeight: 1 })));
  };

  /** ~80% to the marked original when exactly two versions. */
  const splitMostlyOriginal = () => {
    const ctrl = variants.findIndex((v) => v.isControl);
    if (ctrl < 0 || variants.length !== 2) {
      splitEven();
      return;
    }
    onChange(
      variants.map((v, j) => ({
        ...v,
        allocationWeight: j === ctrl ? 4 : 1,
      })),
    );
  };

  return (
    <div className="space-y-5">
      <div
        className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <p className="font-medium text-foreground mb-2 flex flex-wrap items-center gap-2">
          Who sees what
          <MetricTooltip
            label="Traffic split"
            explanation="Higher “traffic share” means more visitors get that version. 1 vs 1 is roughly half and half. Your team can fine-tune this later before going live."
          />
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <Button type="button" variant="secondary" size="sm" className="h-8" onClick={splitEven}>
            50/50 split
          </Button>
          {variants.length === 2 ? (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={splitMostlyOriginal}>
              Mostly original (~80/20)
            </Button>
          ) : null}
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          {percents.map((pct, i) => (
            <div
              key={`seg-${variants[i]?.key ?? i}`}
              className={cn(
                "h-full min-w-[2px] transition-all",
                variants[i]?.isControl ? "bg-primary/50" : "bg-primary",
              )}
              style={{ flex: `${Math.max(pct, 0.01)} 1 0%` }}
              title={`${variants[i]?.name ?? `Version ${i + 1}`}: ${pct.toFixed(0)}%`}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {variants.map((v, i) => (
            <li key={`${v.key}-${i}`} className="flex items-center gap-1 tabular-nums">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  v.isControl ? "bg-primary/50" : "bg-primary",
                )}
                aria-hidden
              />
              <span className="text-foreground">{v.name || `Version ${i + 1}`}</span>
              <span>{percents[i]!.toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      </div>

      {variants.map((v, i) => (
        <div
          key={`${v.key}-${i}`}
          className={cn(
            "rounded-xl border p-4 space-y-3 transition-shadow",
            v.isControl ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : "bg-card",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={v.isControl ? "default" : "secondary"}>
                {v.isControl ? "Original — what’s live today" : "New idea to try"}
              </Badge>
              <span className="text-xs text-muted-foreground">Version {i + 1}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} disabled={variants.length <= 2}>
              Remove version
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-1">
                Friendly name
                <MetricTooltip
                  label="Tip"
                  explanation="What you’ll see in lists and reports — e.g. “Shorter headline”, not jargon."
                />
              </Label>
              <Input
                value={v.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={v.isControl ? "e.g. Current homepage" : "e.g. New hero message"}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                Short code (tracking)
                <MetricTooltip
                  label="Who uses this?"
                  explanation="Developers and tools tie visits to this code. Lowercase letters, numbers, underscores. You can leave the suggestion as-is."
                />
              </Label>
              <Input
                value={v.key}
                onChange={(e) =>
                  update(i, {
                    key: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, ""),
                  })
                }
                className="mt-1.5 font-mono text-sm"
                placeholder="variant_a"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor={`weight-${i}`} className="text-sm whitespace-nowrap shrink-0">
                Traffic share
              </Label>
              <Input
                id={`weight-${i}`}
                type="number"
                min={0.1}
                step={0.1}
                className="w-24"
                value={v.allocationWeight}
                onChange={(e) => update(i, { allocationWeight: Number.parseFloat(e.target.value) || 1 })}
              />
              <MetricTooltip
                label="How it works"
                explanation="Compared to the other rows: 1 vs 1 is half and half; 2 vs 1 sends about twice as many people to the first."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={v.isControl}
                onCheckedChange={(c) => setControlExclusive(i, c)}
                id={`ctrl-${i}`}
                aria-label={`Mark ${v.name || `version ${i + 1}`} as the original control`}
              />
              <Label htmlFor={`ctrl-${i}`} className="text-sm cursor-pointer">
                This is the original / baseline
              </Label>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full sm:w-auto">
        + Add another version to compare
      </Button>
      <p className="text-xs text-muted-foreground">
        Most teams stop at two — current site vs one new idea. Add a third only when you’re deliberately testing several
        combinations together.
      </p>
    </div>
  );
}
