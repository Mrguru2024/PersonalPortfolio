"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricTooltip } from "@/components/aee/MetricTooltip";

export type ExperimentTableRow = {
  id: number;
  key: string;
  name: string;
  status: string;
  funnelStage: string | null;
  offerType: string | null;
  primaryPersonaKey: string | null;
  variantCount: number;
  updatedAt: string;
};

export interface ExperimentTableProps {
  rows: ExperimentTableRow[];
}

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "running") return "default";
  if (s === "paused") return "secondary";
  if (s === "ended") return "outline";
  return "outline";
}

type StatusFilter = "all" | "running" | "draft" | "paused" | "ended";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "draft", label: "Draft" },
  { key: "paused", label: "Paused" },
  { key: "ended", label: "Ended" },
];

export function ExperimentTable({ rows }: ExperimentTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        (r.funnelStage?.toLowerCase().includes(q) ?? false) ||
        (r.offerType?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search experiments"
            placeholder="Search name, key, funnel, offer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={status === f.key ? "default" : "outline"}
              className="h-8"
              aria-pressed={status === f.key}
              onClick={() => setStatus(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} experiments
        <MetricTooltip
          label="Tip"
          className="ml-2 align-middle"
          explanation="Use filters to focus live tests or drafts. Search matches experiment key — use the same key in code when recording variant assignment."
        />
      </p>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">
                <MetricTooltip
                  label="Name"
                  explanation="Click through to variant rollups, channel links, and heuristic recommendations."
                />
              </TableHead>
              <TableHead className="min-w-[100px]">
                <MetricTooltip
                  label="Key"
                  explanation="Stable experiment_key in growth_experiments — reference this in telemetry and CRM metadata."
                />
              </TableHead>
              <TableHead>
                <MetricTooltip
                  label="Status"
                  explanation="Running: eligible for assignment. Draft/paused/ended: check product rules before relying on traffic splits."
                />
              </TableHead>
              <TableHead>
                <MetricTooltip label="Funnel" explanation="Journey stage this test targets (awareness → decision)." />
              </TableHead>
              <TableHead>
                <MetricTooltip label="Offer" explanation="Offer type lens for reporting when populated." />
              </TableHead>
              <TableHead>
                <MetricTooltip label="Persona" explanation="Primary persona key when set on the experiment record." />
              </TableHead>
              <TableHead className="text-right">
                <MetricTooltip
                  label="Variants"
                  explanation="Arms in growth_variants — control is usually marked isControl."
                />
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                <MetricTooltip label="Updated" explanation="Last write to the experiment row; not necessarily last metric rollup." />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  No experiments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                let rel = "";
                try {
                  rel = formatDistanceToNow(new Date(r.updatedAt), { addSuffix: true });
                } catch {
                  rel = "—";
                }
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/admin/experiments/${r.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{r.key}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.funnelStage ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.offerType ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.primaryPersonaKey ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.variantCount}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{rel}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
