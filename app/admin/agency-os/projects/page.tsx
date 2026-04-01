"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AosAgencyProject } from "@shared/schema";

const VALUE_OPTS = [
  { id: "leads", label: "Leads" },
  { id: "conversions", label: "Conversions" },
  { id: "revenue", label: "Revenue" },
  { id: "retention", label: "Retention" },
  { id: "efficiency", label: "Efficiency" },
  { id: "visibility", label: "Visibility" },
  { id: "training", label: "Training" },
] as const;

export default function AgencyOsProjectsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryHvd, setPrimaryHvd] = useState("conversion_funnel");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [impactMetric, setImpactMetric] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [values, setValues] = useState<Record<string, boolean>>({
    leads: true,
    conversions: false,
    revenue: false,
    retention: false,
    efficiency: false,
    visibility: false,
    training: false,
  });

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/agency-os/projects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agency-os/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load projects");
      return res.json() as Promise<{ projects: AosAgencyProject[] }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const vc = (Object.entries(values).filter(([, v]) => v).map(([k]) => k) ?? []) as string[];
      if (vc.length === 0) throw new Error("Select at least one value contribution.");
      const res = await fetch("/api/admin/agency-os/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          primaryHvdSlug: primaryHvd.trim(),
          secondaryHvdSlugs: [],
          valueContributions: vc,
          expectedOutcome: expectedOutcome.trim(),
          impactMetric: impactMetric.trim(),
          dataSource: dataSource.trim(),
          status: "planning",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? `Create failed (${res.status})`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/agency-os/projects"] });
      setName("");
      setDescription("");
      setExpectedOutcome("");
      setImpactMetric("");
      setDataSource("");
      toast({ title: "Project created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Delivery projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal engagements with HVD linkage. Open a row for phases, milestones, and linked tasks.{" "}
          <Link href="/admin/agency-os/hvd" className="text-primary underline">
            HVD registry
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New project</CardTitle>
          <CardDescription>Validated create (same rules as API).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Primary HVD slug</Label>
            <Input
              value={primaryHvd}
              onChange={(e) => setPrimaryHvd(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Value contributions</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VALUE_OPTS.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={values[o.id]}
                    onCheckedChange={(c) => setValues((v) => ({ ...v, [o.id]: c === true }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Expected outcome</Label>
            <Textarea value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Impact metric</Label>
            <Textarea value={impactMetric} onChange={(e) => setImpactMetric(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Data source</Label>
            <Textarea value={dataSource} onChange={(e) => setDataSource(e.target.value)} rows={2} />
          </div>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
          {!isLoading && projects.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HVD</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.primaryHvdSlug}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/agency-os/projects/${p.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
