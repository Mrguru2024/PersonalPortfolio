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
}

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
    <div className="min-h-screen w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-violet-500" />
          Project updates
        </h1>
        <p className="text-muted-foreground">
          Recent changes and improvements, in plain language—no technical jargon.
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
