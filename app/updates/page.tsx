"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  category: "client_project" | "ascendra_innovation" | "site_update" | "market_update";
  factChecked: boolean;
}

const CATEGORY_LABELS: Record<ChangelogEntry["category"], string> = {
  client_project: "Client project update",
  ascendra_innovation: "Ascendra innovation update",
  site_update: "Site update",
  market_update: "Market update",
};

export default function UpdatesPage() {
  const { data, isLoading, error } = useQuery<{ entries: ChangelogEntry[] }>({
    queryKey: ["/api/changelog"],
    queryFn: async () => {
      const res = await fetch("/api/changelog");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      return json;
    },
  });

  const entries = data?.entries ?? [];

  return (
    <div className="min-h-screen w-full min-w-0 max-w-3xl mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-violet-500" />
          Relevant updates
        </h1>
        <p className="text-muted-foreground">
          Fact-checked client project, Ascendra innovation, site, and market updates.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">We couldn’t load updates right now. Please try again later.</p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No updates to show yet. Check back soon.</p>
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
                  {entry.factChecked ? (
                    <>
                      <span aria-hidden>•</span>
                      <span>Fact checked</span>
                    </>
                  ) : null}
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

      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
