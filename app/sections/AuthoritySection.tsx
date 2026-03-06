"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const authorityPoints = [
  "Full-stack development partner across frontend, backend, data, and deployment.",
  "Automation systems builder focused on lead response speed and operational efficiency.",
  "Revenue-focused website architect that aligns UX decisions to conversion outcomes.",
];

const trustSignals = [
  "Production-grade Next.js and TypeScript architecture",
  "SEO + performance + analytics integrated from day one",
  "Clear scope, milestones, and communication throughout delivery",
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
                <Badge variant="outline" className="border-primary/40 text-primary mb-3">
                  Authority Positioning
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Ascendra Technologies is your technical growth partner
                </h2>
                <p className="text-muted-foreground mt-3">
                  We combine product engineering, conversion strategy, and automation to help
                  businesses grow with systems that actually perform.
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

