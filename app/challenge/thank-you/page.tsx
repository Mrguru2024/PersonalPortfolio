"use client";

import Link from "next/link";
import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ChallengeThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-12 max-w-xl">
        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thank you</h1>
            <p className="text-muted-foreground mb-6">
              We&apos;ve received your application. Someone from the team will follow up based on your timeline and interest.
            </p>
            <div className="text-left space-y-4 rounded-lg bg-muted/30 p-4 mb-6">
              <p className="text-sm font-medium text-foreground">What happens next</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>We&apos;ll review your challenge progress and qualification responses.</li>
                <li>If you said you want to discuss soon, we&apos;ll reach out within 1–2 business days.</li>
                <li>You can also book a strategy call directly below.</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="default" className="gap-2">
                <Link href="/strategy-call">
                  <Calendar className="h-4 w-4" />
                  Book a strategy call
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  Back to home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
