"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  BookOpen,
  Handshake,
  Target,
  Shield,
  ArrowRight,
  LogIn,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Hero asset in `public/Ascendra images/` (same area as other Ascendra brand art). */
const AFN_HERO_IMAGE = "/Ascendra images/Ascendra AFN Hero.png";

const VALUE_ITEMS = [
  {
    title: "Connect with founders",
    description: "Meet startup founders, small business owners, freelancers, and operators who get the journey.",
    icon: Users,
  },
  {
    title: "Real discussions",
    description: "Category-based conversations on startup help, getting clients, marketing, AI, and mindset.",
    icon: MessageSquare,
  },
  {
    title: "Premium resources",
    description: "Guides, checklists, and founder-focused content to accelerate your growth.",
    icon: BookOpen,
  },
  {
    title: "Collaboration board",
    description: "Find or offer help—developers, designers, marketers, partners—in a dedicated space.",
    icon: Handshake,
  },
  {
    title: "Your profile, your rules",
    description: "Public or private profile; control who can message you and signal when you're open to collaborate.",
    icon: Shield,
  },
  {
    title: "Intentional ecosystem",
    description: "Built to help Ascendra serve founders better—so you get relevant support and pathways.",
    icon: Target,
  },
];

export default function CommunityLandingPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAuthedUi = mounted && !isLoading && !!user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero — `public/Ascendra images/Ascendra AFN Hero.png` */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container relative mx-auto px-4 py-12 sm:py-20 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <Badge variant="secondary" className="mb-4 gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Founder community
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Ascendra Founder Network
              </h1>
              <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:max-w-xl">
                A premium space for founders, builders, and business owners to connect, discuss, collaborate, and grow—backed
                by the same team that builds brands and tech for growth.
              </p>
              <div className="mt-8 flex min-h-[40px] flex-wrap items-center justify-center gap-3 lg:justify-start">
                {!mounted || isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
                ) : showAuthedUi ? (
                  <>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/Afn/feed">
                        Go to feed <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2">
                      <Link href="/Afn/profile">Your profile</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/auth?redirect=/Afn/onboarding">Join the network</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="gap-2">
                      <Link href="/auth?redirect=/Afn/feed">
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-lg ring-1 ring-border/40">
                <Image
                  src={AFN_HERO_IMAGE}
                  alt="Ascendra Founder Network — founders and builders connecting and growing together"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value grid */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Why join</h2>
          <p className="mt-2 text-muted-foreground">
            Not a generic forum—a curated founder ecosystem with clear value and control.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{item.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border/50 bg-section">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground">Who it's for</h2>
            <p className="mt-2 text-muted-foreground">
              Startup founders, small business owners, operators, creatives, freelancers, consultants, and builders who want a focused community.
            </p>
          </div>
          <ul className="mx-auto flex max-w-xl flex-wrap justify-center gap-3">
            {["Founders", "Freelancers", "Agency owners", "Consultants", "Operators", "Service providers", "Builders"].map((label) => (
              <li key={label}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-4 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <Card className="mx-auto max-w-2xl border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to join?</CardTitle>
            <CardDescription>
              Create your profile, set your visibility and messaging preferences, and start connecting.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[48px] justify-center">
            {!mounted || isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
            ) : showAuthedUi ? (
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/Afn/feed">Go to community feed</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth?redirect=/Afn/onboarding">Join Ascendra Founder Network</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
