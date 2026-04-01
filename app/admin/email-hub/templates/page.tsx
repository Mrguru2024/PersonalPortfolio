"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatUpdatedAt(iso: string | Date | null | undefined): string {
  if (iso == null) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

export default function EmailHubTemplatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["/api/admin/email-hub/templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/templates");
      return (await res.json()) as {
        hubTemplates: { id: number; name: string; category: string; updatedAt: string }[];
        communicationsDesigns: { id: number; name: string; subject: string; category: string; updatedAt: string }[];
      };
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hubTemplates = data?.hubTemplates ?? [];
  const communicationsDesigns = data?.communicationsDesigns ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reusable layouts for Email Hub, with a full visual editor. For large campaign-style layouts, use{" "}
            <span className="text-foreground">Communications</span> designs from the list below.
            {isSuper ?
              <>
                {" "}
                (DB: <code className="text-xs bg-muted px-1 rounded">email_hub_templates</code>.)
              </>
            : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/email-hub/templates/new">New hub template</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/communications/designs/new">New communications design</Link>
          </Button>
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load templates</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span>{error instanceof Error ? error.message : "Unknown error"}</span>
            <Button type="button" variant="outline" size="sm" className="w-fit border-destructive/60" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Email Hub library</h3>
            {hubTemplates.length === 0 ? (
              <div className="p-4 space-y-3 text-sm text-muted-foreground">
                <p>No hub templates yet. Create one with the visual editor (formatting, tables, images, brand colors).</p>
                <Button asChild size="sm">
                  <Link href="/admin/email-hub/templates/new">Create template</Link>
                </Button>
              </div>
            ) : (
              hubTemplates.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t text-sm">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {t.category}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatUpdatedAt(t.updatedAt)}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/email-hub/templates/${t.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40 flex items-center gap-2">
              Communications designs
              <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
            </h3>
            {communicationsDesigns.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No communications designs yet.</p>
            ) : (
              communicationsDesigns.map((d) => (
                <div key={d.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">{d.subject}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/communications/designs/${d.id}`}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
