import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuditRequestForm } from "@/components/funnel/AuditRequestForm";

export const metadata: Metadata = {
  title: "Digital Growth Audit | Ascendra Technologies",
  description:
    "Request a Digital Growth Audit covering brand clarity, visual presentation, and website conversion performance.",
};

const AUDIT_AREAS = [
  "Positioning and messaging clarity",
  "Visual trust and first-impression quality",
  "Homepage and service page structure",
  "CTA placement and lead capture flow",
  "Mobile UX and page speed friction",
  "Conversion blockers and next-step recommendations",
];

export default function AuditPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10 py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <section className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-7 w-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Digital Growth Audit
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              A practical, no-fluff review of what is limiting your online
              growth and what to fix first.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Free entry offer · Built for real business decisions
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border bg-card/80">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground">
                  Style Studio Branding
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Brand clarity review focused on positioning, messaging, and
                  audience relevance.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/80">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground">Macon Designs®</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Visual presentation review focused on trust, consistency, and
                  quality of impression.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/80">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground">
                  Ascendra Technologies
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Website performance, UX, and conversion review focused on
                  practical lead flow improvements.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border bg-card">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Who this is for
                </h2>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Businesses with websites that are not converting consistently",
                    "Teams with unclear messaging or inconsistent brand presentation",
                    "Owners launching or relaunching with limited resources",
                    "Businesses that need strategy, design, and technology aligned",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Sample audit areas
                </h2>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                  {AUDIT_AREAS.map((area) => (
                    <li key={area} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section id="request" className="space-y-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Request your audit
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Share your details so we can qualify your request and prepare
                useful next steps.
              </p>
            </div>
            <AuditRequestForm />
          </section>

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground">
              Prefer to review offers first?
            </p>
            <Button asChild variant="outline" className="mt-3 min-h-[44px]">
              <Link href="/services">
                View services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
