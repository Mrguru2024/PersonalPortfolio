"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuoteResponse {
  id: number;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  proposalData: any;
  validUntil: string | null;
  createdAt: string;
}

export default function ClientProposalDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params?.id ? String(params.id) : null;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const { data: quote, isLoading, error } = useQuery<QuoteResponse>({
    queryKey: ["/api/client/proposals", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/client/proposals/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to load proposal");
      }
      return res.json();
    },
    enabled: !!user && !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/client/proposals/${id}`, {
        status: "accepted",
        paymentPlan: selectedPlan,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to accept");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/invoices"] });
      toast({ title: "Proposal accepted", description: data?.message || "Your deposit invoice has been sent." });
      setAcceptInvoiceUrl(data?.invoiceUrl ?? null);
      setAcceptedJustNow(true);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/client/proposals/${id}`, { status: "rejected" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to decline");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/proposals"] });
      toast({ title: "Proposal declined", description: data?.message });
      router.push("/dashboard");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canRespond = quote && (quote.status === "sent" || quote.status === "pending");
  const proposal = quote?.proposalData;
  const [acceptedJustNow, setAcceptedJustNow] = useState(false);
  const [acceptInvoiceUrl, setAcceptInvoiceUrl] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"30-30-40" | "50-25-25">("30-30-40");

  if (authLoading || !user) return null;
  if (!id) {
    router.push("/dashboard");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !quote) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Proposal not found or you don’t have access.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <Badge variant={quote.status === "accepted" ? "default" : quote.status === "rejected" ? "destructive" : "secondary"}>
          {quote.status === "sent" || quote.status === "pending" ? "Awaiting your decision" : quote.status}
        </Badge>
      </div>

      {acceptedJustNow ? (
        <Card className="overflow-hidden border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="border-b bg-emerald-500/10">
            <CardTitle className="text-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-6 w-6" />
              Proposal accepted
            </CardTitle>
            <CardDescription>Your deposit invoice has been sent by email and is available below and in your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="font-medium">Next steps:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Pay your deposit (link in your email or below).</li>
              <li>We’ll send the agreement for your signature.</li>
              <li>Schedule kickoff to discuss project details.</li>
            </ol>
            {acceptInvoiceUrl && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                <a href={acceptInvoiceUrl} target="_blank" rel="noopener noreferrer">
                  Pay deposit invoice
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl sm:text-2xl">{quote.title}</CardTitle>
          <CardDescription>
            {quote.quoteNumber}
            {proposal?.preparedBy && (
              <span className="block mt-1">Prepared by {proposal.preparedBy}</span>
            )}
          </CardDescription>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(quote.totalAmount)}
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {proposal && (
            <>
              <section>
                <h3 className="font-semibold text-lg mb-2">1. Project overview</h3>
                <p className="text-muted-foreground">{proposal.projectOverview?.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{proposal.projectOverview?.projectType}</Badge>
                  {proposal.projectOverview?.mainGoals?.slice(0, 5).map((g: string, i: number) => (
                    <Badge key={i} variant="secondary">{g}</Badge>
                  ))}
                </div>
              </section>
              <Separator />
              {(proposal.developmentPhases?.length ?? 0) > 0 ? (
                <section>
                  <h3 className="font-semibold text-lg mb-2">2. Development phases</h3>
                  <div className="space-y-4">
                    {proposal.developmentPhases.map((ph: { phaseName: string; purpose: string; included: string[]; benefits: string[]; investment: number | string }, i: number) => (
                      <div key={i} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-semibold">{ph.phaseName}</span>
                          <span className="font-medium text-violet-600 dark:text-violet-400 shrink-0">
                            {typeof ph.investment === "number" ? `$${Number(ph.investment).toLocaleString()}` : ph.investment}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2"><strong>Purpose:</strong> {ph.purpose}</p>
                        {ph.included?.length > 0 && (
                          <p className="text-sm mb-1"><strong>Included:</strong></p>
                        )}
                        <ul className="list-disc list-inside text-sm text-muted-foreground mb-2">
                          {ph.included?.slice(0, 6).map((d: string, j: number) => <li key={j}>{d}</li>)}
                        </ul>
                        {ph.benefits?.length > 0 && (
                          <p className="text-sm"><strong>Benefits:</strong> {ph.benefits.join(" · ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="font-semibold text-lg mb-2">2. Timeline & phases</h3>
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
              )}
              <Separator />
              <section>
                <h3 className="font-semibold text-lg mb-2">Payment schedule</h3>
                {proposal.paymentStructureText && (
                  <p className="text-sm text-muted-foreground mb-3">{proposal.paymentStructureText}</p>
                )}
                <ul className="space-y-2">
                  {proposal.pricing?.paymentSchedule?.map((p: { milestone: string; amount: number; dueDate: string }, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{p.milestone}</span>
                      <span className="font-medium">${p.amount?.toLocaleString()} — {p.dueDate}</span>
                    </li>
                  ))}
                </ul>
              </section>
              {proposal.collaborationNote && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-2">Collaboration & adjustments</h3>
                    <p className="text-sm text-muted-foreground">{proposal.collaborationNote}</p>
                  </section>
                </>
              )}
              {proposal.postLaunchSupportText && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-2">Post-launch support</h3>
                    <p className="text-sm text-muted-foreground">{proposal.postLaunchSupportText}</p>
                  </section>
                </>
              )}
              {proposal.nextSteps?.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h3 className="font-semibold text-lg mb-2">Next steps</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {proposal.nextSteps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </section>
                </>
              )}
            </>
          )}

          {canRespond && (
            <>
              <Separator />
              <div className="space-y-4 pt-2">
                <p className="font-medium">Choose your payment breakdown (deposit now, then remaining installments):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("30-30-40")}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedPlan === "30-30-40"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="font-semibold block">30% / 30% / 40%</span>
                    <span className="text-sm text-muted-foreground">30% deposit, 30% at midpoint, 40% prior to launch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("50-25-25")}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedPlan === "50-25-25"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="font-semibold block">50% / 25% / 25%</span>
                    <span className="text-sm text-muted-foreground">50% deposit, 25% at midpoint, 25% prior to launch</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Accept proposal &amp; get deposit invoice
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate()}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Decline
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
