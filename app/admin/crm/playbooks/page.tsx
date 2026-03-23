"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface Playbook {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  serviceType?: string | null;
  description?: string | null;
  active: boolean;
}

export default function PlaybooksListPage() {
  const { data, isLoading } = useQuery<{ playbooks: Playbook[] }>({
    queryKey: ["/api/admin/crm/playbooks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/playbooks");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const playbooks = data?.playbooks ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm"><ArrowLeft className="h-4 w-4 mr-2" />Back to CRM</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mt-2">Sales playbooks</h1>
        <p className="text-muted-foreground mb-6">Reusable internal guidance for qualification, discovery, and proposal</p>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Playbooks</CardTitle>
                <CardDescription>Create and manage playbooks; link to deals and use in Discovery</CardDescription>
              </div>
            <Button asChild>
              <Link href="/admin/crm/playbooks/new"><Plus className="h-4 w-4 mr-2" />New playbook</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : playbooks.length === 0 ? (
            <>
              <p className="text-muted-foreground text-sm mb-4">No playbooks yet. Create one or run db:seed for defaults.</p>
              <Button asChild><Link href="/admin/crm/playbooks/new"><Plus className="h-4 w-4 mr-2" />Create your first playbook</Link></Button>
            </>
          ) : (
            <ul className="space-y-2">
              {playbooks.map((pb) => (
                <li key={pb.id}>
                  <Link
                    href={`/admin/crm/playbooks/${pb.id}`}
                    className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{pb.title}</span>
                      <div className="flex gap-1">
                        {pb.category && <Badge variant="secondary">{pb.category}</Badge>}
                        {pb.serviceType && <Badge variant="outline">{pb.serviceType}</Badge>}
                      </div>
                    </div>
                    {pb.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pb.description}</p>}
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
