"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/admin/content-studio/documents", label: "Library" },
  { href: "/admin/content-studio/calendar", label: "Calendar" },
  { href: "/admin/content-studio/campaigns", label: "Campaigns" },
  { href: "/admin/content-studio/import-export", label: "Import / export" },
  { href: "/admin/content-studio/workflow", label: "Workflow & logs" },
] as const;

export function ContentStudioShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth");
    else if (!isLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (!user.isAdmin || !user.adminApproved) return null;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-8 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin dashboard
            </Link>
          </Button>
          <Badge variant="secondary">Content Studio · Admin only</Badge>
        </div>
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Internal Content Studio</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Editorial CMS, calendar, campaigns, and publish workflow — separate from live blog/newsletter until you
            promote content through existing pipelines.
          </p>
        </header>
        <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-4 mb-6" aria-label="Content studio">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium min-h-[44px] sm:min-h-0 inline-flex items-center",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
