"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Target, ClipboardList, FolderKanban } from "lucide-react";

export default function AgencyOsOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
        {authLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
          </span>
        ) : (
          "Redirecting…"
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agency Operating System</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Internal delivery layer: classify work by High-Value Delivery (HVD), run projects with acceptance-based
          tasks, and keep an execution log. Distinct from CRM follow-up tasks and client agreement milestones.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Target className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Value (HVD) registry</CardTitle>
            <CardDescription>Categories, outcome hints, and validation for new initiatives.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/agency-os/hvd">Open registry</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Tasks & acceptance</CardTitle>
            <CardDescription>Assign work; accept, decline, or request clarification before execution.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/agency-os/tasks">Open tasks</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FolderKanban className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Projects API</CardTitle>
            <CardDescription>
              Create delivery projects via <code className="text-xs">POST /api/admin/agency-os/projects</code> with
              HVD + impact fields validated server-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Full project UI (kanban, milestones) comes next; data model and APIs are live after{" "}
            <code className="text-xs">db:push</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
