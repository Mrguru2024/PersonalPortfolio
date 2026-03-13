import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrategyCallForm } from "@/components/funnel/StrategyCallForm";
import { FunnelPageShell } from "@/components/funnel/FunnelPageShell";

export const metadata: Metadata = {
  title: "Contact | Strategy Call | Ascendra Technologies",
  description:
    "Request a strategy call with the Ascendra ecosystem for brand, design, and website growth system planning.",
};

export default function ContactPage() {
  return (
    <FunnelPageShell className="py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Strategy call request
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              For businesses ready to discuss implementation scope, delivery
              structure, and next-step execution.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <Card className="border-border bg-card funnel-card">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Before you book
                </h2>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                  {[
                    "Be clear on your immediate business objective.",
                    "Share your current website and brand context.",
                    "Outline your timeline and internal constraints.",
                    "If your direction is unclear, start with the audit first.",
                  ].map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-6 rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    Need diagnostic clarity before a call?
                  </p>
                  <Button asChild variant="outline" className="mt-3 min-h-[44px] w-full">
                    <Link href="/audit">
                      Request a Digital Growth Audit
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <StrategyCallForm />
          </section>
        </div>
      </div>
    </FunnelPageShell>
  );
}
