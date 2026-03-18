"use client";

import Link from "next/link";
import { CheckCircle2, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thank you</h1>
            <p className="text-muted-foreground mb-6">
              We’ve received your details and your growth diagnosis results. Check your email for a summary.
            </p>

            <div className="text-left space-y-4 rounded-lg bg-muted/30 p-4 mb-6">
              <p className="text-sm font-medium text-foreground">What happens next</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>We’ll review your responses and match you with the right next step.</li>
                <li>Someone from our team will follow up within 1–2 business days.</li>
                <li>If you’d like to book a call now, use the button below.</li>
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
