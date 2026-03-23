"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ChallengeWelcomePage() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-12 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">You&apos;re in</h1>
              <p className="text-muted-foreground mb-6">
                Welcome to the challenge. Your first step is to open the dashboard and start Day 1.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="gap-2 w-full sm:w-auto mx-auto">
                  <Link href={registrationId ? `/challenge/dashboard?registrationId=${registrationId}` : "/challenge/dashboard"}>
                    <Layout className="h-4 w-4" />
                    Go to challenge dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Bookmark this page or the dashboard link so you can return each day.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
