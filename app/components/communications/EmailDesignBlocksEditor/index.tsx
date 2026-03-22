"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2 } from "lucide-react";

export interface EmailDesignBlocksEditorProps {
  /** Row values in order; empty strings allowed while editing. */
  blockRows: string[];
  onBlockRowsChange: (rows: string[]) => void;
  externalLinkCount: number;
}

export function EmailDesignBlocksEditor({ blockRows, onBlockRowsChange, externalLinkCount }: EmailDesignBlocksEditorProps) {
  const rows = blockRows.length > 0 ? blockRows : [""];

  const setRow = (i: number, id: string) => {
    const next = [...rows];
    next[i] = id;
    onBlockRowsChange(next);
  };

  const addRow = () => {
    onBlockRowsChange([...rows, ""]);
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) {
      onBlockRowsChange([""]);
      return;
    }
    const next = rows.filter((_, j) => j !== i);
    onBlockRowsChange(next.length ? next : [""]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onBlockRowsChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Click-tracking block names</Label>
        <span className="text-xs text-muted-foreground">
          {externalLinkCount > 0 ?
            `${externalLinkCount} external link${externalLinkCount === 1 ? "" : "s"} in body — one row per link in order (top to bottom).`
          : "Add a link in the body to enable per-block click stats."}
        </span>
      </div>
      <ul className="space-y-2">
        {rows.map((id, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-muted-foreground" title="Order matches link order in the email">
              <GripVertical className="h-4 w-4" />
            </span>
            <span className="text-xs text-muted-foreground w-6 tabular-nums">{i + 1}.</span>
            <Input
              value={id}
              onChange={(e) => setRow(i, e.target.value)}
              placeholder="e.g. hero_cta"
              className="font-mono text-sm"
              aria-label={`Block id ${i + 1}`}
            />
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(i, i + 1)}
                disabled={i === rows.length - 1}
                aria-label="Move down"
              >
                ↓
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(i)} aria-label="Remove row">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
        <Plus className="h-4 w-4" />
        Add block row
      </Button>
    </div>
  );
}
