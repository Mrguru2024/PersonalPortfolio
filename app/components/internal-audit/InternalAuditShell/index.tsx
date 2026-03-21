"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function InternalAuditShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoading && !user) router.replace("/auth");
    else if (!isLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [mounted, user, isLoading, router]);

  if (!mounted || isLoading || !user) {
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
            Admin · Funnel health
          </Badge>
        </div>
        <header className="mb-8 border-b border-border/60 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Website funnel audit</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            Compare your live site and database against a fixed checklist (lead capture, CRM, content, analytics,
            and CTAs). Each run shows scores, the exact files and tables that were checked, and prioritized
            recommendations you can act on.
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
