"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

interface CaseStudyRecord {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  persona: string;
  recommendedSystem: string;
  publishState: string;
  featured: boolean;
  ctaLabel: string | null;
  ctaHref: string | null;
  updatedAt: string;
}

export function CaseStudiesListingClient() {
  const [search, setSearch] = useState("");
  const [persona, setPersona] = useState("");
  const [system, setSystem] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CaseStudyRecord[]>([]);
  const [featured, setFeatured] = useState<CaseStudyRecord[]>([]);
  const { track } = useVisitorTracking();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (persona) params.set("persona", persona);
        if (system) params.set("system", system);
        const response = await fetch(`/api/case-studies?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Failed to fetch case studies");
        if (!active) return;
        setRows(payload.caseStudies ?? []);
        setFeatured(payload.featured ?? []);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setRows([]);
        setFeatured([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [search, persona, system]);

  const filteredCountLabel = useMemo(() => {
    if (loading) return "Loading case studies...";
    if (!rows.length) return "No matching case studies found.";
    return `${rows.length} case study${rows.length === 1 ? "" : "ies"} available.`;
  }, [loading, rows.length]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Proof Library</p>
        <h1 className="text-3xl md:text-4xl font-bold">Case Studies</h1>
        <p className="text-muted-foreground">
          Diagnose bottlenecks, review proof, then convert with the right system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Case Studies</CardTitle>
          <CardDescription>Search by persona and recommended system.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search title or summary"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              <option value="trades">Trades</option>
              <option value="freelancers">Freelancers</option>
              <option value="founders">Founders</option>
              <option value="operators">Operators</option>
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
              <option value="lead_system">Lead System</option>
              <option value="authority_system">Authority System</option>
              <option value="validation_funnel">Validation Funnel</option>
              <option value="revenue_system">Revenue System</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {featured.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Featured</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((entry) => (
              <Card key={`featured-${entry.id}`} className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{entry.title}</CardTitle>
                  <CardDescription>{entry.subtitle || entry.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                  <Button asChild>
                    <Link
                      href={`/case-studies/${entry.slug}`}
                      onClick={() =>
                        track("case_study_cta_click", {
                          pageVisited: "/case-studies",
                          metadata: { slug: entry.slug, placement: "featured" },
                        })
                      }
                    >
                      View Case Study
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">{filteredCountLabel}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="text-lg">{entry.title}</CardTitle>
                <CardDescription>{entry.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">{entry.persona}</span>
                  <span className="rounded-full border px-2 py-1">{entry.recommendedSystem}</span>
                </div>
                <Button asChild variant="outline">
                  <Link
                    href={`/case-studies/${entry.slug}`}
                    onClick={() =>
                      track("case_study_cta_click", {
                        pageVisited: "/case-studies",
                        metadata: { slug: entry.slug, placement: "listing" },
                      })
                    }
                  >
                    Read Case Study
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
