"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function EmailHubTemplatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading } = useQuery({
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-sm text-muted-foreground">
            Hub templates are stored in <code className="text-xs bg-muted px-1 rounded">email_hub_templates</code>.
            Communications campaign designs stay in the legacy builder — link through for complex HTML.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/communications/designs/new">New communications design</Link>
        </Button>
      </div>

      {isLoading || !data ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <>
          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40">Email Hub library</h3>
            {data.hubTemplates.length === 0 ?
              <p className="p-4 text-sm text-muted-foreground">
                No hub templates yet — create via API or seed. Clone from a communications design to avoid duplicate editors.
              </p>
            : data.hubTemplates.map((t) => (
                <div key={t.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {t.category}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(t.updatedAt), "MMM d, yyyy")}</span>
                </div>
              ))}
          </section>

          <section className="rounded-2xl border border-border/60 overflow-hidden">
            <h3 className="text-sm font-medium px-4 py-3 bg-muted/40 flex items-center gap-2">
              Communications designs
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </h3>
            {data.communicationsDesigns.map((d) => (
              <div key={d.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 border-t text-sm">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{d.subject}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/communications/designs/${d.id}`}>Open</Link>
                </Button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
