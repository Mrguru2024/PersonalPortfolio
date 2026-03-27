"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { EmailHubDraft } from "@shared/emailHubSchema";

export default function EmailHubDraftsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/email-hub/drafts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/email-hub/drafts");
      if (!res.ok) throw new Error("drafts");
      return (await res.json()) as EmailHubDraft[];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const list = drafts.filter((d) => d.status === "draft");

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Drafts</h2>
          <p className="text-sm text-muted-foreground">Saved compositions — open compose to continue editing (copy id into a new flow in a later iteration).</p>
        </div>
        <Button asChild>
          <Link href="/admin/email-hub/compose">New email</Link>
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-2xl p-8 text-center bg-muted/20">No drafts yet.</p>
      ) : (
        <div className="rounded-2xl border border-border/60 divide-y divide-border/50 overflow-hidden bg-card/80">
          {list.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{d.subject || "(no subject)"}</p>
                <p className="text-xs text-muted-foreground truncate">{(d.toJson as string[]).join(", ")}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Updated {format(new Date(d.updatedAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{d.status}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/email-hub/compose?draftId=${d.id}`}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
