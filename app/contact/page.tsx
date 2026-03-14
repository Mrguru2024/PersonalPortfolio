import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StrategyCallForm } from "@/components/funnel/StrategyCallForm";

export const metadata: Metadata = {
  title: "Contact | Book a call | Ascendra Technologies",
  description:
    "Book a free call with the Brand Growth team to discuss your brand, design, or website goals.",
};

export default function ContactPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10 sm:space-y-12">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              Book a free call
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              For when you’re ready to talk through your goals, scope, and next steps.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <Card className="border-border bg-card">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
                  Before you book
                </h2>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
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
                    <Link href="/digital-growth-audit">
                      Get your free audit
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
    </div>
  );
}
