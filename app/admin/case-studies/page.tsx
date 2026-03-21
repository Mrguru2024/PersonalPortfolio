"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CaseStudyRecord {
  id: number;
  title: string;
  slug: string;
  summary: string;
  persona: string;
  recommendedSystem: string;
  publishState: string;
  featured: boolean;
  completenessScore: number;
  updatedAt: string;
}

export default function AdminCaseStudiesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<CaseStudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [persona, setPersona] = useState("");
  const [system, setSystem] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user?.isAdmin || !user?.adminApproved) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (persona) params.set("persona", persona);
        if (system) params.set("system", system);
        const response = await apiRequest("GET", `/api/admin/case-studies?${params.toString()}`);
        const payload = await response.json();
        if (!active) return;
        setRows(payload.caseStudies ?? []);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [persona, search, system, user?.adminApproved, user?.isAdmin]);

  const statusCounts = useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.publishState] = (acc[row.publishState] ?? 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  if (authLoading || !user || !user.isAdmin || !user.adminApproved) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Case Study Studio</h1>
          <p className="text-sm text-muted-foreground">
            Manage proof assets, publish states, AI generation, and conversion CTAs.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/case-studies/new">
            <Plus className="h-4 w-4 mr-2" />
            New case study
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["draft", "preview", "published", "archived"].map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statusCounts[status] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and narrow by persona/system.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, slug, summary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona">Persona</Label>
            <select
              id="persona"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
            >
              <option value="">All personas</option>
              <option value="trades">trades</option>
              <option value="freelancers">freelancers</option>
              <option value="founders">founders</option>
              <option value="operators">operators</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system">System</Label>
            <select
              id="system"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={system}
              onChange={(event) => setSystem(event.target.value)}
            >
              <option value="">All systems</option>
              <option value="lead_system">lead_system</option>
              <option value="authority_system">authority_system</option>
              <option value="validation_funnel">validation_funnel</option>
              <option value="revenue_system">revenue_system</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No case studies found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{row.title}</CardTitle>
                    <CardDescription>{row.summary}</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">{row.publishState}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">{row.persona}</span>
                  <span className="rounded-full border px-2 py-1">{row.recommendedSystem}</span>
                  <span className="rounded-full border px-2 py-1">Completeness {row.completenessScore}%</span>
                  {row.featured ? <span className="rounded-full border px-2 py-1">Featured</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/case-studies/${row.id}`}>Edit</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/case-studies/${row.slug}${row.publishState !== "published" ? "?preview=1" : ""}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
