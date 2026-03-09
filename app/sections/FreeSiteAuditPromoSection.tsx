"use client";

import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BOOK_CALL_HREF } from "@/lib/funnelCtas";
import SectionAmbient from "@/components/SectionAmbient";

const PAIN_POINTS = [
  "Websites that do not generate leads",
  "Lack of automation",
  "Weak SEO",
  "Slow mobile performance",
];

const FreeSiteAuditPromoSection = () => {

  return (
    <section
      id="site-audit-promo"
      className="w-full min-w-0 max-w-full relative py-6 fold:py-8 sm:py-10 md:py-14 overflow-x-hidden overflow-y-visible"
      aria-label="Free site audit offer"
    >
      <SectionAmbient variant="orbs" className="opacity-70" />
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 dark:from-primary/20 dark:via-primary/10 dark:to-emerald-500/20" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <motion.div
        className="container mx-auto px-4 sm:px-6 relative min-w-0"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto rounded-2xl border-2 border-primary/30 dark:border-primary/50 bg-card/80 dark:bg-card/90 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/15 dark:bg-primary/25 text-primary shrink-0">
                <Search className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-primary">FREE</span> Website Growth Audit
                </h2>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-lg">
                  Many businesses struggle with: websites that do not generate leads, lack of automation, weak SEO, slow mobile performance.’s performance, SEO, accessibility, and UX—no obligation.
                </p>
                <p className="mt-3 text-foreground font-semibold text-sm sm:text-base">
                  Most businesses do not have a design problem.
                </p>
                <p className="mt-0.5 text-primary font-semibold text-sm sm:text-base">
                  They have a system problem.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                <Link href={AUDIT_PATH}>
                  {PRIMARY_CTA}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-2">
                <Link href={BOOK_CALL_HREF}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default FreeSiteAuditPromoSection;
