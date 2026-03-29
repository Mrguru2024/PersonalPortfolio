"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

export function VariantBuilder({ variants, onChange }: VariantBuilderProps) {
  const update = (i: number, patch: Partial<VariantDraft>) => {
    const next = variants.map((row, j) => (j === i ? { ...row, ...patch } : row));
    onChange(next);
  };

  const add = () => {
    const n = variants.length + 1;
    onChange([
      ...variants,
      { key: `variant_${String.fromCharCode(96 + n)}`, name: `Variant ${n}`, allocationWeight: 1, isControl: false },
    ]);
  };

  const remove = (i: number) => {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-4">
      {variants.map((v, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Variant key</Label>
              <Input value={v.key} onChange={(e) => update(i, { key: e.target.value })} className="font-mono text-sm" />
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={v.name} onChange={(e) => update(i, { name: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Weight</Label>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                className="w-24"
                value={v.allocationWeight}
                onChange={(e) => update(i, { allocationWeight: Number.parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={v.isControl} onCheckedChange={(c) => update(i, { isControl: c })} id={`ctrl-${i}`} />
              <Label htmlFor={`ctrl-${i}`} className="text-sm cursor-pointer">
                Control
              </Label>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} disabled={variants.length <= 1}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        Add variant
      </Button>
    </div>
  );
}
