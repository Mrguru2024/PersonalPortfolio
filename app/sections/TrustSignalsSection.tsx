"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Wrench, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/data";

const trustSignals = [
  {
    icon: Workflow,
    title: "System-first implementation",
    description:
      "Every build aligns UX, conversion goals, and automation so your website works like a revenue system.",
  },
  {
    icon: Wrench,
    title: "Full-stack execution",
    description:
      "Frontend, backend, data, and integrations delivered as one cohesive architecture instead of fragmented handoffs.",
  },
  {
    icon: ShieldCheck,
    title: "Production-grade quality",
    description:
      "Clean code, maintainable structure, and performance-conscious delivery built for long-term growth.",
  },
] as const;

export default function TrustSignalsSection() {
  const highlightedProjects = projects.slice(0, 3);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-background/95">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="border-primary/40 text-primary mb-3">
            Trust & Authority
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Built for outcomes, not just output
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
            Ascendra combines technical depth and conversion strategy to help businesses
            launch faster and grow with confidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {trustSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <Card key={signal.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    {signal.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{signal.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Highlights</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlightedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-md border p-4 hover:border-primary/40 transition-colors"
              >
                <p className="font-semibold mb-1">{project.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>
                <p className="text-xs text-primary mt-3 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  View project details
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

