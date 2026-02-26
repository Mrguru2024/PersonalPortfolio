"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Info, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export interface PublicAnnouncement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

const typeConfig: Record<
  string,
  { icon: React.ElementType; borderClass: string; bgClass: string; label: string }
> = {
  info: {
    icon: Info,
    borderClass: "border-l-blue-500 dark:border-l-blue-400",
    bgClass: "bg-blue-500/5 dark:bg-blue-500/10",
    label: "Info",
  },
  update: {
    icon: Sparkles,
    borderClass: "border-l-amber-500 dark:border-l-amber-400",
    bgClass: "bg-amber-500/5 dark:bg-amber-500/10",
    label: "Update",
  },
  success: {
    icon: CheckCircle2,
    borderClass: "border-l-emerald-500 dark:border-l-emerald-400",
    bgClass: "bg-emerald-500/5 dark:bg-emerald-500/10",
    label: "Update",
  },
  warning: {
    icon: AlertCircle,
    borderClass: "border-l-orange-500 dark:border-l-orange-400",
    bgClass: "bg-orange-500/5 dark:bg-orange-500/10",
    label: "Notice",
  },
};

function getTypeConfig(type: string) {
  return typeConfig[type] ?? typeConfig.info;
}

export default function AnnouncementsSection() {
  const { data: announcements = [], isLoading } = useQuery<PublicAnnouncement[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/announcements", { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 60_000,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (isLoading) {
    return (
      <section id="announcements" className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10">
        <div className="container px-4 mx-auto">
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section
      id="announcements"
      className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10 scroll-mt-20"
    >
      <div className="container px-4 mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 mb-8 justify-center"
          >
            <Megaphone className="h-7 w-7 text-primary" aria-hidden />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Project updates & announcements
            </h2>
          </motion.div>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Latest news and updates about projects and services.
          </p>
          <ul className="space-y-4">
            {announcements.map((a) => {
              const config = getTypeConfig(a.type);
              const Icon = config.icon;
              return (
                <motion.li key={a.id} variants={itemVariants}>
                  <Card
                    className={`overflow-hidden border-l-4 ${config.borderClass} ${config.bgClass} border-border/50 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <span
                          className="shrink-0 rounded-full p-1.5 bg-background/80"
                          aria-hidden
                        >
                          <Icon className="h-4 w-4 text-foreground/70" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-lg leading-tight">
                            {a.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(a.createdAt), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 pt-0">
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-9 sm:pl-10">
                        {a.content}
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
