"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Layout, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CHALLENGE_NAME,
  CHALLENGE_SUBTITLE,
  CHALLENGE_PRICE_DISPLAY,
  ORDER_BUMP,
  LESSON_DAYS,
} from "@/lib/challenge/config";

export default function ChallengeLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        {/* Hero with contained visual */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-sm font-medium text-primary mb-2">{CHALLENGE_SUBTITLE}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            {CHALLENGE_NAME}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Most websites don&apos;t convert because they lack structure, clear messaging, and lead systems.
            This 5-day challenge helps you build a website system that attracts and converts clients—with
            guided strategy, not random education.
          </p>
          <div className="relative w-full max-w-3xl mx-auto aspect-[21/9] sm:aspect-[2/1] rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mb-8">
            <Image src="/stock images/Diversity_17.jpeg" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" aria-hidden />
          </div>
          <Button asChild size="lg" className="gap-2 min-h-[48px]">
            <Link href="/challenge/checkout">
              Join the challenge — {CHALLENGE_PRICE_DISPLAY}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.section>

        {/* Who this is for */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Who this is for</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Business owners who want more leads from their website
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Coaches, consultants, and service providers ready to systematize their presence
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Anyone who knows their site could convert better but isn&apos;t sure where to start
            </li>
          </ul>
        </motion.section>

        {/* What you'll learn — 5 days */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">What you&apos;ll learn in 5 days</h2>
          <div className="space-y-3">
            {LESSON_DAYS.map((item, i) => (
              <Card key={item.day} className="border-border">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <span className="text-sm font-medium text-primary shrink-0">Day {item.day}</span>
                  <span className="text-foreground">{item.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Pricing + Order bump */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mb-12"
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Challenge entry</h2>
              <p className="text-3xl font-bold text-foreground">{CHALLENGE_PRICE_DISPLAY}</p>
              <p className="text-sm text-muted-foreground">One-time. Full access to all 5 days and materials.</p>
            </CardHeader>
            {ORDER_BUMP.enabled && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="font-medium text-foreground">{ORDER_BUMP.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{ORDER_BUMP.description}</p>
                  <p className="text-sm text-primary mt-2">{ORDER_BUMP.priceDisplay}</p>
                </div>
              </CardContent>
            )}
            <CardContent>
              <Button asChild size="lg" className="w-full gap-2">
                <Link href="/challenge/checkout">
                  Get started — {CHALLENGE_PRICE_DISPLAY}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Trust / Authority */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">From the Ascendra ecosystem</h2>
          <p className="text-muted-foreground mb-4">
            This challenge can lead to implementation support through Ascendra Technologies and partners:
            Style Studio Branding (strategy and positioning) and Macon Designs (visual identity and creative execution).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/partners/ascendra-technologies">Ascendra Technologies</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/partners/style-studio-branding">Style Studio</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/partners/macon-designs">Macon Designs</Link>
            </Button>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">FAQ</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground">What do I get?</p>
              <p className="text-sm text-muted-foreground">Daily lessons and action steps for 5 days, plus access to a simple dashboard to track progress. Optional growth toolkit add-on.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Is this a course or a one-time challenge?</p>
              <p className="text-sm text-muted-foreground">A guided 5-day challenge with a clear outcome: your client-generating website plan. Not a long course—focused and actionable.</p>
            </div>
            <div>
              <p className="font-medium text-foreground">What if I want implementation help after?</p>
              <p className="text-sm text-muted-foreground">At the end you can apply for a strategy call. We&apos;ll use your challenge results and growth diagnosis to route you to the right support—Ascendra, Style Studio, or Macon Designs.</p>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">Ready to build a website system that generates clients?</p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/challenge/checkout">
              Join the challenge — {CHALLENGE_PRICE_DISPLAY}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.section>
      </div>
    </div>
  );
}
