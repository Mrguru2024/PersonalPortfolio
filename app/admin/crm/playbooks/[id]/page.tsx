"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
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
  checklistItems?: string[] | null;
  qualificationRules?: string | null;
  redFlags?: string | null;
  proposalRequirements?: string | null;
  followUpGuidance?: string | null;
  active: boolean;
}

export default function PlaybookDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: playbook, isLoading } = useQuery({
    queryKey: ["/api/admin/crm/playbooks", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/playbooks/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading || !playbook) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pb = playbook as Playbook;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm/playbooks"><ArrowLeft className="h-4 w-4 mr-2" />Back to playbooks</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {pb.title}
                </CardTitle>
                <CardDescription className="mt-1 flex gap-2">
                  {pb.category && <Badge variant="secondary">{pb.category}</Badge>}
                  {pb.serviceType && <Badge variant="outline">{pb.serviceType}</Badge>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {pb.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pb.description}</p>
              </div>
            )}
            {(pb.checklistItems?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Checklist</h3>
                <ul className="list-disc pl-4 space-y-0.5 text-sm text-muted-foreground">
                  {pb.checklistItems!.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {pb.qualificationRules && (
              <div>
                <h3 className="text-sm font-medium mb-1">Qualification rules</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pb.qualificationRules}</p>
              </div>
            )}
            {pb.redFlags && (
              <div>
                <h3 className="text-sm font-medium mb-1">Red flags</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pb.redFlags}</p>
              </div>
            )}
            {pb.proposalRequirements && (
              <div>
                <h3 className="text-sm font-medium mb-1">Proposal requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pb.proposalRequirements}</p>
              </div>
            )}
            {pb.followUpGuidance && (
              <div>
                <h3 className="text-sm font-medium mb-1">Follow-up guidance</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pb.followUpGuidance}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
