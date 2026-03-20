"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function InternalAuditShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth");
    else if (!isLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user.isAdmin || !user.adminApproved) return null;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-8 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin dashboard
            </Link>
          </Button>
          <Badge variant="outline" className="text-xs">
            $100M Leads alignment · Internal
          </Badge>
        </div>
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lead alignment audit</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Rerunnable engine against Ascendra codebase + DB signals. Full detail is admin-only; client-safe summaries
            are stored on each run for a future API.
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
