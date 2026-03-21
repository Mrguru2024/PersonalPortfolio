"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import type { CaseStudy } from "@shared/schema";

export function CaseStudyDetailClient({
  caseStudy,
  related,
}: {
  caseStudy: CaseStudy;
  related: Array<{ id: number; slug: string; title: string; summary: string }>;
}) {
  const { track } = useVisitorTracking();

  useEffect(() => {
    track("case_study_view", {
      pageVisited: `/case-studies/${caseStudy.slug}`,
      metadata: {
        slug: caseStudy.slug,
        persona: caseStudy.persona,
        system: caseStudy.recommendedSystem,
      },
    });
  }, [caseStudy.slug, caseStudy.persona, caseStudy.recommendedSystem, track]);

  const ctaLabel = caseStudy.ctaLabel?.trim() || caseStudy.sections.cta || "Book Strategy Call";
  const ctaHref = caseStudy.ctaHref?.trim() || "/strategy-call";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-primary font-semibold">Case Study</p>
        <h1 className="text-3xl md:text-4xl font-bold">{caseStudy.title}</h1>
        {caseStudy.subtitle ? <p className="text-lg text-muted-foreground">{caseStudy.subtitle}</p> : null}
        <p className="text-muted-foreground">{caseStudy.sections.hero || caseStudy.summary}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Results Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>{caseStudy.sections.results || caseStudy.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-1">{caseStudy.persona}</span>
            <span className="rounded-full border px-2 py-1">{caseStudy.recommendedSystem}</span>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Problem</CardTitle>
          </CardHeader>
          <CardContent>{caseStudy.sections.problem || "Problem details coming soon."}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>{caseStudy.sections.diagnosis || "Diagnosis details coming soon."}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solution</CardTitle>
          </CardHeader>
          <CardContent>{caseStudy.sections.solution || "Solution details coming soon."}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>{caseStudy.sections.results || "Results details coming soon."}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Visual Proof</CardTitle>
        </CardHeader>
        <CardContent>{caseStudy.sections.visualProof || "Visual proof assets will be added before publishing."}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CTA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{caseStudy.sections.cta || "Take the next step with a connected revenue system."}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link
                href={ctaHref}
                onClick={() =>
                  track("case_study_cta_click", {
                    pageVisited: `/case-studies/${caseStudy.slug}`,
                    metadata: { slug: caseStudy.slug, cta: ctaLabel },
                  })
                }
              >
                {ctaLabel}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/revenue-diagnostic">Run Diagnostic</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/strategy-call">Book Strategy Call</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related Content</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {related.length ? (
            related.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <CardTitle className="text-base">{entry.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/case-studies/${entry.slug}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">More case studies will appear here.</p>
          )}
        </div>
      </section>
    </div>
  );
}
