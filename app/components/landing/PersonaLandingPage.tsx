"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { PageSEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrimaryFunnelCTA } from "@/components/funnel/PrimaryFunnelCTA";

export interface PersonaLandingPageProps {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  painPoints: string[];
  outcomes: string[];
  serviceHighlights: string[];
  caseExamples: {
    title: string;
    summary: string;
  }[];
}

export function PersonaLandingPage({
  slug,
  title,
  subtitle,
  heroDescription,
  painPoints,
  outcomes,
  serviceHighlights,
  caseExamples,
}: PersonaLandingPageProps) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageSEO
        title={`${title} | Ascendra Technologies`}
        description={heroDescription}
        canonicalPath={`/${slug}`}
        schemaType="WebPage"
      />

      <section className="space-y-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{title}</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
          {subtitle}
        </p>
        <p className="text-muted-foreground max-w-3xl mx-auto">{heroDescription}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/audit">
              <Search className="mr-2 h-4 w-4" />
              Get Your Free Website Growth Audit
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/schedule">
              Book a Strategy Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pain Points We Solve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {painPoints.map((point) => (
              <div key={point} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-sm">{point}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcomes You Can Expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outcomes.map((outcome) => (
              <div key={outcome} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-sm">{outcome}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>What’s Included</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {serviceHighlights.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Case-Style Examples</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {caseExamples.map((example) => (
            <Card key={example.title}>
              <CardHeader>
                <CardTitle className="text-lg">{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{example.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <PrimaryFunnelCTA />
      </section>
    </div>
  );
}

