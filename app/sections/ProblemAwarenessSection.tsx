"use client";

import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, Gauge, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const problems = [
  {
    icon: AlertTriangle,
    title: "Websites that do not generate leads",
    description:
      "Traffic lands on pages, but visitors leave without clear next steps or compelling conversion paths.",
  },
  {
    icon: Workflow,
    title: "No automated follow-up system",
    description:
      "Inbound leads go cold because there is no workflow connecting forms, notifications, and response sequences.",
  },
  {
    icon: Gauge,
    title: "Slow mobile performance",
    description:
      "Poor mobile speed and UX reduce trust, increase bounce rate, and kill conversion momentum.",
  },
  {
    icon: BarChart3,
    title: "No analytics or funnel visibility",
    description:
      "Without reliable tracking, you cannot identify where leads drop off or which campaigns drive revenue.",
  },
];

export default function ProblemAwarenessSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="border-primary/40 text-primary mb-3">
            Problem Awareness
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Most businesses do not have a design problem.
            <br />
            <span className="text-primary">They have a system problem.</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
            Growth stalls when your website, automation, and funnel strategy are disconnected.
            We help you fix the entire system.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <Card key={problem.title} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-start gap-2">
                    <Icon className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                    {problem.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

