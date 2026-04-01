"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type Design = {
  id: number;
  name: string;
  subject: string;
  category: string;
  status: string;
  updatedAt: string;
};

export default function CommunicationsDesignsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuperUser = isAuthSuperUser(user);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["/api/admin/communications/designs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/communications/designs");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Design[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Templates & designs</h2>
          <p className="text-sm text-muted-foreground">
            Reusable email layouts for campaigns—subject, preview line, and body. Optional labels for link areas help
            show which parts of the email get clicks in your reports.
          </p>
          {isSuperUser ? (
            <details className="mt-2 text-xs text-muted-foreground max-w-2xl">
              <summary className="cursor-pointer font-medium text-foreground">Technical note (site owner)</summary>
              <p className="mt-2 leading-relaxed">
                Stored fields include full HTML plus the link-area labels that power click breakdowns in analytics (and
                any future drag-and-drop editor).
              </p>
            </details>
          ) : null}
        </div>
        <Button asChild>
          <Link href="/admin/communications/designs/new">
            <Plus className="h-4 w-4 mr-2" />
            New design
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : designs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No designs yet</CardTitle>
            <CardDescription>
              {isSuperUser ? (
                <>
                  Create a design to get started. Starter templates may exist if they were added for your environment.
                </>
              ) : (
                <>Create a design to get started.</>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {designs.map((d) => (
            <li key={d.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{d.subject}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{d.category}</Badge>
                      <Badge variant="outline">{d.status}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/communications/designs/${d.id}`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
