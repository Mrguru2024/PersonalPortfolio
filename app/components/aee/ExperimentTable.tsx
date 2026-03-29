"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function ExperimentTable({ rows }: ExperimentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Funnel</TableHead>
          <TableHead>Persona</TableHead>
          <TableHead className="text-right">Variants</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <Link href={`/admin/experiments/${r.id}`} className="font-medium text-primary hover:underline">
                {r.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs font-mono">{r.key}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.funnelStage ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{r.primaryPersonaKey ?? "—"}</TableCell>
            <TableCell className="text-right">{r.variantCount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
