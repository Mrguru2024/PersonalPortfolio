"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { BRAND_GROWTH_PATH } from "@/lib/funnelCtas";

const PREP_CHECKLIST = [
  "Current website (if you have one) — we’ll take a quick look",
  "Branding examples you like or current logo/colors",
  "Your main goals (launch, rebrand, more leads, etc.)",
  "Rough timeline or urgency",
];

export default function CallConfirmationPage() {
  return (
    <>
      <PageSEO
        title="Call request received | Next Steps"
        description="Your call request was received. Here’s what to prepare and what to expect."
        canonicalPath="/call-confirmation"
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10 py-8 fold:py-10 xs:py-12 sm:py-16 md:py-20 relative">
        <div className="absolute inset-0">
          <Image src="/Ascendra images/shutterstock_535948222.jpg" alt="" fill className="object-cover opacity-[0.06] dark:opacity-[0.05]" sizes="100vw" />
        </div>
        <div className="container relative mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-xl">
          <Card className="border-border bg-card shadow-lg overflow-hidden">
            <CardHeader className="text-center px-4 sm:px-6 md:px-8 pb-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary mx-auto mb-3 sm:mb-4 shrink-0">
                <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <CardTitle className="text-center text-xl sm:text-2xl">You’re on the list</CardTitle>
              <CardDescription className="text-center text-sm sm:text-base max-w-md mx-auto break-words min-w-0">
                Thanks for requesting a strategy call. We’ll reach out shortly to find a time that works for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6 md:px-8 pt-0">
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2 mb-3">
                  What happens next
                </h3>
                <ol className="space-y-2 text-sm sm:text-base text-muted-foreground mb-4">
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="font-semibold text-primary shrink-0">1.</span>
                    <span className="break-words min-w-0">We'll email you within 24–48 hours to pick a time.</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="font-semibold text-primary shrink-0">2.</span>
                    <span className="break-words min-w-0">You'll get a short prep list (below) so the call is productive.</span>
                  </li>
                  <li className="flex items-start gap-2 min-w-0">
                    <span className="font-semibold text-primary shrink-0">3.</span>
                    <span className="break-words min-w-0">On the call: your goals, our approach, and clear next steps—no pressure.</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2 mb-3">
                  <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
                  What to prepare for the call
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {PREP_CHECKLIST.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span className="break-words min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 dark:bg-muted/20 p-4 space-y-2">
                <h4 className="font-semibold text-foreground text-sm">What to expect on the call</h4>
                <p className="text-sm text-muted-foreground break-words min-w-0">
                  You will speak with a real person from the Brand Growth team—no call center, no script. We will listen to your goals, clarify where you are (launch, rebrand, or marketing focus), and outline clear next steps. No pressure to commit; the call is about fit and clarity.
                </p>
              </div>
              <p className="text-sm text-muted-foreground break-words min-w-0 italic">
                Your goals, our approach, and clear next steps—no pressure.
              </p>
              <p className="text-sm text-muted-foreground break-words min-w-0">
                Optional: If you’d like, we can send a short intro video from the team so you know what to expect. Otherwise, we’ll keep the call focused and low-pressure—your goals, our approach, and clear next steps.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center pt-2">
                <Button asChild size="lg" className="gap-2 w-full sm:w-auto min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
                  <Link href={BRAND_GROWTH_PATH}>Back to Brand Growth</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
