"use client";

import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FreeSiteAuditPromoSection = () => {
  const scrollToContact = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="site-audit-promo"
      className="relative py-10 md:py-14 overflow-hidden"
      aria-label="Free site audit offer"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 dark:from-primary/20 dark:via-primary/10 dark:to-emerald-500/20" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <motion.div
        className="container mx-auto px-4 sm:px-6 relative"
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Limited offer
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  <span className="text-primary">FREE</span> Site Audit
                </h2>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-lg">
                  Get a professional review of your site’s performance, SEO, accessibility, and UX—no obligation.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                size="lg"
                onClick={scrollToContact}
                className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                Claim free audit
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default FreeSiteAuditPromoSection;
