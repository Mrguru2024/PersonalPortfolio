"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, Plus, ListOrdered } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface CrmSequence {
  id: number;
  name: string;
  description: string | null;
  steps: Array<{ type: string; waitDays: number; subject?: string; taskTitle?: string }>;
  isActive: boolean;
}

export default function CrmSequencesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: sequences = [], isLoading } = useQuery<CrmSequence[]>({
    queryKey: ["/api/admin/crm/sequences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/sequences");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-2">Email sequences</h1>
        <p className="text-muted-foreground">Multi-step campaigns: emails and tasks with wait days</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sequences yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Create a sequence to automate follow-up steps (email + wait + task).</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <Card key={seq.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {seq.name}
                    {!seq.isActive && <span className="text-xs font-normal text-muted-foreground">(paused)</span>}
                  </CardTitle>
                  {seq.description && <CardDescription>{seq.description}</CardDescription>}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/crm?enrollSequence=${seq.id}`}>Enroll leads</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{seq.steps?.length ?? 0} steps</p>
                <ul className="space-y-1 text-sm">
                  {seq.steps?.slice(0, 5).map((step, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {step.type === "email" ? <Mail className="h-3 w-3" /> : <ListOrdered className="h-3 w-3" />}
                      {step.type === "email" ? (step.subject || "Email") : (step.taskTitle || "Task")} — wait {step.waitDays} day(s)
                    </li>
                  ))}
                  {(seq.steps?.length ?? 0) > 5 && <li className="text-muted-foreground">+{(seq.steps?.length ?? 0) - 5} more</li>}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button asChild>
          <Link href="/admin/crm/sequences/new">
            <Plus className="h-4 w-4 mr-2" />
            New sequence
          </Link>
        </Button>
      </div>
    </div>
  );
}
