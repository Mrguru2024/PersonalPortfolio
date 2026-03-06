"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const authorityPoints = [
  "Full-stack delivery across frontend, backend, data, and deployment.",
  "Automation implementation that shortens response time and removes manual bottlenecks.",
  "Conversion-aware UX decisions tied to measurable business outcomes.",
];

const trustSignals = [
  "Production-grade Next.js and TypeScript architecture",
  "SEO, performance, and analytics integrated from day one",
  "Clear scope, milestones, and communication from kickoff to launch",
];

export default function AuthoritySection() {
  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-background to-purple-600/10">
          <CardContent className="py-8 sm:py-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-7">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Ascendra Technologies is the team that builds and ships
                </h2>
                <p className="text-muted-foreground mt-3">
                  After strategy, you need execution. We turn growth plans into production-ready
                  systems without handoff gaps.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {authorityPoints.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {trustSignals.map((signal) => (
                    <div key={signal} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-1 text-primary shrink-0" />
                      <p className="text-sm">{signal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

