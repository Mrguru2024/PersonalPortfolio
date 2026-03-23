"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Video, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DiscoveryWorkspace {
  id: number;
  contactId: number;
  dealId?: number | null;
  accountId?: number | null;
  title: string;
  status: string;
  callDate?: string | null;
  meetingType?: string | null;
  fitAssessment?: string | null;
  readinessAssessment?: string | null;
  updatedAt: string;
}

export default function DiscoveryListPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ workspaces: DiscoveryWorkspace[] }>({
    queryKey: ["/api/admin/crm/discovery", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/discovery?contactId=${contactId}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!contactId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/crm/discovery", {
        contactId: Number(contactId),
        title: "Discovery call",
        status: "draft",
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (ws: DiscoveryWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/discovery", contactId] });
      toast({ title: "Discovery workspace created" });
      window.location.href = `/admin/crm/discovery/${ws.id}`;
    },
    onError: () => toast({ title: "Failed to create workspace", variant: "destructive" }),
  });

  const workspaces = data?.workspaces ?? [];

  if (!contactId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm"><ArrowLeft className="h-4 w-4 mr-2" />Back to CRM</Link>
          </Button>
          <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Open a lead first, then use Discovery workspace from the lead detail page.</p>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/crm/${contactId}`}><ArrowLeft className="h-4 w-4 mr-2" />Back to lead</Link>
        </Button>
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          New discovery workspace
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Discovery workspaces</CardTitle>
          <CardDescription>Prepare and capture discovery calls for this lead</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : workspaces.length === 0 ? (
            <p className="text-muted-foreground text-sm">No discovery workspaces yet. Create one to prepare for a call.</p>
          ) : (
            <ul className="space-y-2">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <Link
                    href={`/admin/crm/discovery/${ws.id}`}
                    className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{ws.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {ws.status} · {ws.updatedAt ? format(new Date(ws.updatedAt), "PP") : ""}
                      </span>
                    </div>
                    {(ws.fitAssessment || ws.readinessAssessment) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fit: {ws.fitAssessment ?? "—"} · Readiness: {ws.readinessAssessment ?? "—"}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
