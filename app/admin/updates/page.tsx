"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

interface AdminUpdateEntry {
  date: string;
  title: string;
  description: string;
  category: "project_update" | "agency_market_data";
  audience: "admin_only";
}

const CATEGORY_LABELS: Record<AdminUpdateEntry["category"], string> = {
  project_update: "Project update",
  agency_market_data: "Agency market data",
};

export default function AdminUpdatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [authLoading, router, user]);

  const { data, isLoading, error } = useQuery<{ entries: AdminUpdateEntry[] }>({
    queryKey: ["/api/admin/updates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/updates");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      return json;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen w-full min-w-0 max-w-4xl mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-violet-500" />
            Internal updates
          </h1>
          <p className="text-muted-foreground">
            Admin-only updates with non-technical project summaries and agency-focused market data.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">We couldn’t load internal updates right now. Please try again later.</p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No internal updates to show yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(entry.date), "PPP")}
                  <span aria-hidden>•</span>
                  <span>{CATEGORY_LABELS[entry.category]}</span>
                  <span aria-hidden>•</span>
                  <span>Admin only</span>
                </div>
                <CardTitle className="text-base sm:text-lg">{entry.title}</CardTitle>
                <CardDescription className="text-sm text-foreground/80">
                  {entry.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
