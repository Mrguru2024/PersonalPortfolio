"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ViewResponse {
  quoteId: number;
  title: string;
  totalAmount: number;
  status: string;
  validUntil: string | null;
  proposalData: any;
  canApprove: boolean;
}

export default function ProposalViewByTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token ? String(params.token) : null;

  const { data, isLoading, error } = useQuery<ViewResponse>({
    queryKey: ["/api/proposal/view", token],
    queryFn: async () => {
      const res = await fetch(`/api/proposal/view/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Proposal not found");
      }
      return res.json();
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invalid link.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">This proposal link is invalid or has expired.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const proposal = data.proposalData;

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl sm:text-2xl">{data.title}</CardTitle>
          <CardDescription>Proposal #{data.quoteId}</CardDescription>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(data.totalAmount)}
          </p>
          <Badge variant={data.status === "accepted" ? "default" : data.status === "rejected" ? "destructive" : "secondary"}>
            {data.status}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {proposal && (
            <>
              <section>
                <h3 className="font-semibold text-lg mb-2">Project overview</h3>
                <p className="text-muted-foreground">{proposal.projectOverview?.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{proposal.projectOverview?.projectType}</Badge>
                </div>
              </section>
              <Separator />
              <section>
                <h3 className="font-semibold text-lg mb-2">Timeline & phases</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {proposal.timeline?.totalDuration} — Start: {proposal.timeline?.startDate}
                </p>
                <div className="space-y-3">
                  {proposal.timeline?.phases?.map((ph: { phase: string; duration: string; deliverables: string[] }, i: number) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{ph.phase}</span>
                        <Badge variant="outline">{ph.duration}</Badge>
                      </div>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {ph.deliverables?.slice(0, 4).map((d: string, j: number) => (
                          <li key={j}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
              <Separator />
              <section>
                <h3 className="font-semibold text-lg mb-2">Payment schedule</h3>
                <ul className="space-y-2">
                  {proposal.pricing?.paymentSchedule?.map((p: { milestone: string; amount: number; dueDate: string }, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{p.milestone}</span>
                      <span className="font-medium">${p.amount?.toLocaleString()} — {p.dueDate}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {data.canApprove && (
            <>
              <Separator />
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-3">Sign in to accept or decline this proposal.</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/auth?redirect=${encodeURIComponent(`/dashboard/proposals/${data.quoteId}`)}`}>
                      Sign in to respond
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Back to home</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
