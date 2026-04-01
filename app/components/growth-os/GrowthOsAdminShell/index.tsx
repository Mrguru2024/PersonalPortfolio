"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrowthOsSubnav } from "@/components/growth-os/GrowthOsSubnav";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { resolveAscendraAccessRole } from "@shared/accessScope";

export interface GrowthOsAdminShellProps {
  children: ReactNode;
}

/**
 * Wraps Growth OS admin routes — approved platform admins only.
 * Uses the same gate as other admin pages (isAdmin + adminApproved).
 */
export function GrowthOsAdminShell({ children }: GrowthOsAdminShellProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!user.isAdmin || !user.adminApproved) {
    return null;
  }

  const coarseRole = resolveAscendraAccessRole(user);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-8 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin dashboard
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Growth OS
            </Badge>
            <Badge variant="outline" className="text-xs">
              {coarseRole === "ADMIN"
                ? "Signed in as admin"
                : `Access level: ${coarseRole.replace(/_/g, " ").toLowerCase()}`}
            </Badge>
          </div>
        </div>

        <header className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Growth Operating System
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            One place to manage who can see growth data, leave private team notes, build client-safe links, and
            review activity. Everything here is for approved admins only.
          </p>
        </header>

        <Accordion type="single" collapsible className="mb-6 rounded-lg border border-border/60 px-4 bg-muted/20">
          <AccordionItem value="how" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
              How Growth OS fits together
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2 pb-4">
              <p>
                <strong className="text-foreground">Overview</strong> — See which modules exist, attach{" "}
                <strong className="text-foreground">team-only notes</strong> to a specific item, or set{" "}
                <strong className="text-foreground">who may see</strong> a report or diagnosis.
              </p>
              <p>
                <strong className="text-foreground">Intelligence</strong> — Research and automation (drafts,
                digests, audits). Raw scores stay internal; clients only see what you put into a share.
              </p>
              <p>
                <strong className="text-foreground">Security &amp; audit</strong> — Recent actions (shares,
                notes, visibility changes) so you can trace what changed.
              </p>
              <p>
                <strong className="text-foreground">Client shares</strong> — Create a link with a{" "}
                <strong className="text-foreground">sanitized</strong> summary your customer can open. Sensitive
                fields are stripped on the server.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <GrowthOsSubnav />
        {children}
      </div>
    </div>
  );
}
