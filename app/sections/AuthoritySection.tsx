"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA, AUDIT_PATH } from "@/lib/funnelCtas";
import { Layers, Zap, TrendingUp } from "lucide-react";
import SectionAmbient from "@/components/SectionAmbient";

const POINTS = [
  { icon: Layers, label: "Full-stack development partner" },
  { icon: Zap, label: "Automation system builder" },
  { icon: TrendingUp, label: "Revenue-focused web architect" },
];

export default function AuthoritySection() {
  return (
    <section
      id="authority"
      className="w-full min-w-0 max-w-full overflow-x-hidden py-10 fold:py-12 xs:py-16 sm:py-20 bg-muted/20 dark:bg-muted/10 relative"
    >
      <SectionAmbient variant="full" />
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 min-w-0 max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-xl fold:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6">
            Built for Businesses That Need Results
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Ascendra is your full-stack development partner—focused on systems and business outcomes, not just design. We build automation systems and conversion-focused websites that turn visitors into revenue.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mb-8">
            {POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium text-foreground text-sm sm:text-base">{label}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-md">
            <Link href={AUDIT_PATH}>{PRIMARY_CTA}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
