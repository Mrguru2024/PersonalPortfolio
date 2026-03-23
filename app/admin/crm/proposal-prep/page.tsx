"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ProposalPrepWorkspace {
  id: number;
  contactId: number;
  dealId?: number | null;
  status: string;
  offerDirection?: string | null;
  proposalReadinessScore?: number | null;
  updatedAt: string;
}

export default function ProposalPrepListPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const dealId = searchParams.get("dealId");
  const queryKey = contactId ? ["/api/admin/crm/proposal-prep", contactId] : ["/api/admin/crm/proposal-prep", dealId];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ workspaces: ProposalPrepWorkspace[] }>({
    queryKey,
    queryFn: async () => {
      const url = contactId
        ? `/api/admin/crm/proposal-prep?contactId=${contactId}`
        : `/api/admin/crm/proposal-prep?dealId=${dealId}`;
      const res = await apiRequest("GET", url);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!(contactId || dealId),
  });

  const { data: dealData } = useQuery({
    queryKey: ["/api/admin/crm/deals", dealId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/deals/${dealId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!dealId && !contactId,
  });
  const resolvedContactId = contactId ? Number(contactId) : dealData?.contactId;

  const createMutation = useMutation({
    mutationFn: async () => {
      const cid = resolvedContactId ?? data?.workspaces?.[0]?.contactId;
      if (!cid) throw new Error("Contact required");
      const res = await apiRequest("POST", "/api/admin/crm/proposal-prep", {
        contactId: cid,
        ...(dealId ? { dealId: Number(dealId) } : {}),
        status: "draft",
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (ws: ProposalPrepWorkspace) => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Proposal prep workspace created" });
      window.location.href = `/admin/crm/proposal-prep/${ws.id}`;
    },
    onError: () => toast({ title: "Failed to create workspace", variant: "destructive" }),
  });

  const workspaces = data?.workspaces ?? [];
  const entityId = contactId ?? dealId;

  if (!contactId && !dealId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm"><ArrowLeft className="h-4 w-4 mr-2" />Back to CRM</Link>
          </Button>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Open a lead or deal first, then use Proposal prep from the lead detail page.</p>
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
          <Link href={contactId ? `/admin/crm/${contactId}` : "/admin/crm"}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to {contactId ? "lead" : "CRM"}
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || (!contactId && !resolvedContactId)}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          New proposal prep
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Proposal prep workspaces</CardTitle>
          <CardDescription>Internal prep before writing the proposal</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : workspaces.length === 0 ? (
            <p className="text-muted-foreground text-sm">No proposal prep workspaces yet. Create one to capture scope and readiness.</p>
          ) : (
            <ul className="space-y-2">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <Link
                    href={`/admin/crm/proposal-prep/${ws.id}`}
                    className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{ws.offerDirection || "Proposal prep"}</span>
                      <span className="text-xs text-muted-foreground">
                        {ws.status} · {ws.updatedAt ? format(new Date(ws.updatedAt), "PP") : ""}
                      </span>
                    </div>
                    {ws.proposalReadinessScore != null && (
                      <p className="text-xs text-muted-foreground mt-1">Readiness: {ws.proposalReadinessScore}%</p>
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
