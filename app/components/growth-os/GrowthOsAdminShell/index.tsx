"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrowthOsSubnav } from "@/components/growth-os/GrowthOsSubnav";
import { Badge } from "@/components/ui/badge";
import { resolveAscendraAccessRole } from "@shared/accessScope";

export interface GrowthOsAdminShellProps {
  children: ReactNode;
}

/**
 * Phase 1: wraps Growth OS admin routes — approved platform admins only.
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
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin dashboard
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Growth OS · Phase 1
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              Access: {coarseRole}
            </Badge>
          </div>
        </div>

        <header className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Growth Operating System
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Internal foundation: visibility classes, audit trail, and client-safe share tokens. All routes
            here are admin-only unless explicitly opened in a later phase.
          </p>
        </header>

        <GrowthOsSubnav />
        {children}
      </div>
    </div>
  );
}
