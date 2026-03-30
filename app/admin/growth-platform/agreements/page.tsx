"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ExternalLink, FileDown, Loader2, PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgreementSignaturePad } from "@/components/legal/AgreementSignaturePad";
import { useToast } from "@/hooks/use-toast";
import { DOCUMENT_TYPE_LABELS, SIGNATURE_FIELDS_BY_ROLE, type DocumentType } from "@shared/documentSigningEngine";

type MilestoneRow = {
  id: number;
  label: string;
  amountCents: number;
  status: string;
  stripeInvoiceId: string | null;
};

type AgreementBundle = {
  agreement: {
    id: number;
    publicToken: string;
    status: string;
    clientName: string;
    clientEmail: string;
    variablesJson?: Record<string, unknown> | null;
    signatureAuditJson?: Record<string, unknown> | null;
    signedAt: Date | string | null;
    createdAt: Date | string;
    docusignEnvelopeId?: string | null;
    docusignStatus?: string | null;
    pdfGeneratedAt?: Date | string | null;
  };
  milestones: MilestoneRow[];
};

type AgreementSummaryRow = AgreementBundle["agreement"];
type AgreementAuditEntry = { signedAt?: string; legalName?: string; auditDigest?: string };

type RetainerRow = {
  id: number;
  agreementId: number | null;
  clientEmail: string;
  clientName: string | null;
  stripeSubscriptionId: string;
  status: string;
  interval: string;
  amountCents: number;
  currentPeriodEnd: Date | string | null;
};

function getAgreementDocumentType(agreement: AgreementSummaryRow): DocumentType {
  const raw = agreement.variablesJson?.documentType;
  return raw === "contract" ? "contract" : "agreement";
}

function getAdminSignatureAudit(agreement: AgreementSummaryRow): AgreementAuditEntry | null {
  const audit = agreement.signatureAuditJson;
  if (!audit || typeof audit !== "object") return null;
  const admin = (audit as Record<string, unknown>).admin;
  if (!admin || typeof admin !== "object") return null;
  const entry = admin as Record<string, unknown>;
  return {
    signedAt: typeof entry.signedAt === "string" ? entry.signedAt : undefined,
    legalName: typeof entry.legalName === "string" ? entry.legalName : undefined,
    auditDigest: typeof entry.auditDigest === "string" ? entry.auditDigest : undefined,
  };
}

export default function AdminGrowthPlatformAgreementsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const listQuery = useQuery({
    queryKey: ["/api/admin/service-agreements"],
    queryFn: async () => {
      const res = await fetch("/api/admin/service-agreements", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const j = (await res.json()) as { agreements: AgreementBundle[] };
      return j.agreements ?? [];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const retainersQuery = useQuery({
    queryKey: ["/api/admin/retainer-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/retainer-subscriptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const j = (await res.json()) as { retainers: RetainerRow[] };
      return j.retainers ?? [];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("agreement");
  const [companyLegal, setCompanyLegal] = useState("");
  const [tierHint, setTierHint] = useState("DFY");
  const [clauseSlugLine, setClauseSlugLine] = useState("");
  const [scopeBullets, setScopeBullets] = useState(
    "Install core funnel and tracking\nWeekly optimization cadence\nReporting dashboard access",
  );
  const [pricingNarrative, setPricingNarrative] = useState(
    "Milestone invoices as listed below. Ad spend billed by platforms unless otherwise scoped.",
  );
  const [m1Label, setM1Label] = useState("Deposit — kickoff");
  const [m1Dollars, setM1Dollars] = useState("2000");
  const [m2Label, setM2Label] = useState("Midpoint");
  const [m2Dollars, setM2Dollars] = useState("1500");
  const [m3Label, setM3Label] = useState("Prior to launch");
  const [m3Dollars, setM3Dollars] = useState("1500");

  const [retainerEmail, setRetainerEmail] = useState("");
  const [retainerName, setRetainerName] = useState("");
  const [retainerAgreementId, setRetainerAgreementId] = useState("");
  const [retainerPriceId, setRetainerPriceId] = useState("");
  const [adminSignDialogOpen, setAdminSignDialogOpen] = useState(false);
  const [adminSignAgreementId, setAdminSignAgreementId] = useState<number | null>(null);
  const [adminSignLegalName, setAdminSignLegalName] = useState("");
  const [adminSignAcceptTerms, setAdminSignAcceptTerms] = useState(false);
  const [adminSignAcceptEngagement, setAdminSignAcceptEngagement] = useState(false);
  const [adminSignImageBase64, setAdminSignImageBase64] = useState<string | null>(null);
  const [adminSignSubmitting, setAdminSignSubmitting] = useState(false);

  const createMut = useMutation({
    mutationFn: async () => {
      const milestones = [
        { label: m1Label, amountDollars: Number(m1Dollars) },
        { label: m2Label, amountDollars: Number(m2Dollars) },
        { label: m3Label, amountDollars: Number(m3Dollars) },
      ].filter((m) => m.label.trim() && Number.isFinite(m.amountDollars) && m.amountDollars > 0);
      const clauseSlugs = clauseSlugLine
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const res = await fetch("/api/admin/service-agreements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          documentType,
          companyLegalName: companyLegal.trim() || null,
          tierHint: tierHint.trim() || null,
          scopeBullets,
          pricingNarrative,
          milestones,
          ...(clauseSlugs.length ? { clauseSlugs } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Create failed");
      }
      return res.json() as Promise<AgreementBundle>;
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["/api/admin/service-agreements"] });
      toast({
        title: "Agreement created",
        description: `Sign link: /agreements/${data.agreement.publicToken.slice(0, 10)}…`,
      });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const retainerMut = useMutation({
    mutationFn: async () => {
      const aid = retainerAgreementIdNum();
      const res = await fetch("/api/admin/retainer-subscriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: retainerEmail.trim(),
          clientName: retainerName.trim() || null,
          agreementId: aid,
          stripePriceId: retainerPriceId.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? `Failed (${res.status})`);
      return j;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["/api/admin/retainer-subscriptions"] });
      toast({ title: "Retainer subscription created", description: "Stripe will bill per the price interval." });
      setRetainerEmail("");
      setRetainerName("");
      setRetainerAgreementId("");
      setRetainerPriceId("");
    },
    onError: (e: Error) => toast({ title: "Retainer error", description: e.message, variant: "destructive" }),
  });

  function resetAdminSignDialog() {
    setAdminSignAgreementId(null);
    setAdminSignLegalName("");
    setAdminSignAcceptTerms(false);
    setAdminSignAcceptEngagement(false);
    setAdminSignImageBase64(null);
    setAdminSignSubmitting(false);
  }

  function openAdminSignDialog(agreementId: number) {
    setAdminSignAgreementId(agreementId);
    setAdminSignDialogOpen(true);
  }

  async function submitAdminSignature() {
    if (!adminSignAgreementId) return;
    setAdminSignSubmitting(true);
    try {
      const res = await fetch(`/api/admin/service-agreements/${adminSignAgreementId}/admin-sign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: adminSignLegalName,
          acceptTerms: adminSignAcceptTerms,
          acceptEngagement: adminSignAcceptEngagement,
          signatureImageBase64: adminSignImageBase64,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Admin signature failed");
      toast({ title: "Admin signature recorded" });
      await qc.invalidateQueries({ queryKey: ["/api/admin/service-agreements"] });
      setAdminSignDialogOpen(false);
      resetAdminSignDialog();
    } catch (e) {
      toast({
        title: "Admin signature error",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAdminSignSubmitting(false);
    }
  }

  function retainerAgreementIdNum(): number | null {
    const n = Number(retainerAgreementId.trim());
    return Number.isFinite(n) ? n : null;
  }

  async function issueStripe(agreementId: number, milestoneId: number) {
    const res = await fetch(`/api/admin/service-agreements/${agreementId}/stripe-milestone`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: "Stripe", description: (j as { error?: string }).error ?? "Failed", variant: "destructive" });
      return;
    }
    toast({ title: "Invoice sent" });
    if ((j as { hostInvoiceUrl?: string }).hostInvoiceUrl) {
      window.open((j as { hostInvoiceUrl: string }).hostInvoiceUrl, "_blank", "noopener,noreferrer");
    }
    await qc.invalidateQueries({ queryKey: ["/api/admin/service-agreements"] });
  }

  async function downloadAgreementPdf(agreementId: number) {
    const res = await fetch(`/api/admin/service-agreements/${agreementId}/pdf`, { credentials: "include" });
    if (!res.ok) {
      toast({ title: "PDF", description: "Could not generate PDF", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascendra-agreement-${agreementId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "PDF downloaded" });
    await qc.invalidateQueries({ queryKey: ["/api/admin/service-agreements"] });
  }

  async function sendDocuSign(agreementId: number) {
    const res = await fetch(`/api/admin/service-agreements/${agreementId}/docusign`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "DocuSign",
        description: (j as { error?: string }).error ?? "Send failed",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "DocuSign envelope sent", description: `Envelope ${(j as { envelopeId?: string }).envelopeId ?? ""}` });
    await qc.invalidateQueries({ queryKey: ["/api/admin/service-agreements"] });
  }

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {authLoading ?
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </span>
        : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-16">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/growth-platform">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Growth platform
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/growth-platform/clauses">Clause library</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Service agreements</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Document signing engine for contracts and agreements with client DocuSign delivery, reusable signature fields, and
          admin-side signing controls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New document</CardTitle>
          <CardDescription>
            Milestone amounts are in dollars. Leave clause slugs empty to use the default stack from the clause library.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cn">Client contact name</Label>
            <Input id="cn" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ce">Client email</Label>
            <Input id="ce" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cl">Client legal entity (optional)</Label>
            <Input id="cl" value={companyLegal} onChange={(e) => setCompanyLegal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier">Tier hint</Label>
            <Input id="tier" value={tierHint} onChange={(e) => setTierHint(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agreement">{DOCUMENT_TYPE_LABELS.agreement}</SelectItem>
                <SelectItem value="contract">{DOCUMENT_TYPE_LABELS.contract}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="clauses">Clause slugs (optional, comma- or space-separated)</Label>
            <Input
              id="clauses"
              placeholder="e.g. no-guarantee payment-terms"
              value={clauseSlugLine}
              onChange={(e) => setClauseSlugLine(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Scope (one bullet per line)</Label>
            <Textarea value={scopeBullets} onChange={(e) => setScopeBullets(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Pricing narrative</Label>
            <Textarea value={pricingNarrative} onChange={(e) => setPricingNarrative(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2 sm:col-span-2 grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Milestone 1</Label>
              <Input value={m1Label} onChange={(e) => setM1Label(e.target.value)} className="mt-1" />
              <Input
                type="number"
                min={0}
                step={100}
                value={m1Dollars}
                onChange={(e) => setM1Dollars(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Milestone 2</Label>
              <Input value={m2Label} onChange={(e) => setM2Label(e.target.value)} className="mt-1" />
              <Input
                type="number"
                min={0}
                step={100}
                value={m2Dollars}
                onChange={(e) => setM2Dollars(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Milestone 3</Label>
              <Input value={m3Label} onChange={(e) => setM3Label(e.target.value)} className="mt-1" />
              <Input
                type="number"
                min={0}
                step={100}
                value={m3Dollars}
                onChange={(e) => setM3Dollars(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="button" onClick={() => createMut.mutate()} disabled={createMut.isPending || !clientName || !clientEmail}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & mark sent"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe retainer subscriptions</CardTitle>
          <CardDescription>
            Recurring billing via Stripe Subscriptions (not milestone invoices). Uses STRIPE_RETAINER_DEFAULT_PRICE_ID unless you
            override price id below. Webhook events update status here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client email</Label>
              <Input value={retainerEmail} onChange={(e) => setRetainerEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Client name (optional)</Label>
              <Input value={retainerName} onChange={(e) => setRetainerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Link to agreement id (optional)</Label>
              <Input
                value={retainerAgreementId}
                onChange={(e) => setRetainerAgreementId(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
            <div className="space-y-2">
              <Label>Stripe price id override (optional)</Label>
              <Input value={retainerPriceId} onChange={(e) => setRetainerPriceId(e.target.value)} placeholder="price_…" />
            </div>
          </div>
          <Button
            type="button"
            disabled={retainerMut.isPending || !retainerEmail.trim()}
            onClick={() => retainerMut.mutate()}
          >
            {retainerMut.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" />
            : "Create Stripe subscription"}
          </Button>

          {retainersQuery.isLoading ?
            <Loader2 className="h-5 w-5 animate-spin" />
          : !(retainersQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No retainers recorded yet.</p>
          : (
            <ul className="text-xs space-y-2 border-t pt-3">
              {retainersQuery.data!.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {r.clientEmail}
                    {r.agreementId ? ` · agreement #${r.agreementId}` : ""} · {r.status} · ${(r.amountCents / 100).toFixed(2)}/
                    {r.interval}
                  </span>
                  <span className="text-muted-foreground font-mono">{r.stripeSubscriptionId}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent agreements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listQuery.isLoading ?
            <Loader2 className="h-5 w-5 animate-spin" />
          : !(listQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No agreements yet.</p>
          : (
            <ul className="space-y-4 text-sm">
              {listQuery.data.map((b) => {
                const a = b.agreement;
                const documentTypeLabel = DOCUMENT_TYPE_LABELS[getAgreementDocumentType(a)];
                const adminAudit = getAdminSignatureAudit(a);
                return (
                  <li key={a.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">
                        #{a.id} — {documentTypeLabel} · {a.clientName} · {a.clientEmail}
                      </span>
                      <BadgeInline status={a.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Signing fields: {SIGNATURE_FIELDS_BY_ROLE.client.map((f) => f.label).join(", ")}
                    </p>
                    {(a.docusignEnvelopeId || a.pdfGeneratedAt || a.docusignStatus) ?
                      <p className="text-xs text-muted-foreground">
                        {a.docusignEnvelopeId ? `DocuSign: ${a.docusignEnvelopeId} (${a.docusignStatus ?? "—"})` : null}
                        {a.pdfGeneratedAt ?
                          `${a.docusignEnvelopeId ? " · " : ""}PDF at ${String(a.pdfGeneratedAt).slice(0, 19)}`
                        : null}
                      </p>
                    : null}
                    {adminAudit ?
                      <p className="text-xs text-muted-foreground">
                        Admin signed by {adminAudit.legalName ?? "unknown"}
                        {adminAudit.signedAt ? ` · ${new Date(adminAudit.signedAt).toLocaleString()}` : ""}
                      </p>
                    : null}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agreements/${a.publicToken}`} target="_blank" rel="noreferrer">
                          Open sign page
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/agreements/${a.publicToken}`)}
                      >
                        Copy link
                      </Button>
                      <Button variant="outline" size="sm" type="button" onClick={() => downloadAgreementPdf(a.id)}>
                        <FileDown className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" type="button" onClick={() => openAdminSignDialog(a.id)}>
                        <PenLine className="h-3 w-3 mr-1" />
                        Admin sign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => sendDocuSign(a.id)}
                        disabled={!!a.docusignEnvelopeId}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {a.docusignEnvelopeId ? "DocuSign sent" : "DocuSign"}
                      </Button>
                    </div>
                    {b.milestones.length > 0 ?
                      <ul className="space-y-1 border-t pt-2 text-xs">
                        {b.milestones.map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              #{m.id} — {m.label} · ${(m.amountCents / 100).toFixed(2)} · {m.status}
                              {m.stripeInvoiceId ? ` · ${m.stripeInvoiceId}` : ""}
                            </span>
                            {m.status !== "paid" ?
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7"
                                onClick={() => issueStripe(a.id, m.id)}
                                disabled={!!m.stripeInvoiceId}
                              >
                                {m.stripeInvoiceId ? "Invoice issued" : "Stripe invoice"}
                              </Button>
                            : null}
                          </li>
                        ))}
                      </ul>
                    : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={adminSignDialogOpen}
        onOpenChange={(open) => {
          setAdminSignDialogOpen(open);
          if (!open) resetAdminSignDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin signature fields</DialogTitle>
            <DialogDescription>
              Complete required admin signature fields for agreement #{adminSignAgreementId ?? "—"} before sending or archiving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-sign-legal-name">Admin legal name</Label>
              <Input
                id="admin-sign-legal-name"
                value={adminSignLegalName}
                onChange={(e) => setAdminSignLegalName(e.target.value)}
                placeholder="Full legal name"
              />
            </div>
            <AgreementSignaturePad onChange={setAdminSignImageBase64} />
            <div className="flex items-start gap-2">
              <Checkbox
                id="admin-sign-terms"
                checked={adminSignAcceptTerms}
                onCheckedChange={(checked) => setAdminSignAcceptTerms(checked === true)}
              />
              <Label htmlFor="admin-sign-terms" className="text-sm font-normal cursor-pointer">
                {SIGNATURE_FIELDS_BY_ROLE.admin.find((field) => field.key === "acceptTerms")?.label}
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="admin-sign-engagement"
                checked={adminSignAcceptEngagement}
                onCheckedChange={(checked) => setAdminSignAcceptEngagement(checked === true)}
              />
              <Label htmlFor="admin-sign-engagement" className="text-sm font-normal cursor-pointer">
                {SIGNATURE_FIELDS_BY_ROLE.admin.find((field) => field.key === "acceptEngagement")?.label}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAdminSignDialogOpen(false);
                resetAdminSignDialog();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitAdminSignature()}
              disabled={adminSignSubmitting}
            >
              {adminSignSubmitting ?
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              : "Save admin signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BadgeInline({ status }: { status: string }) {
  const c =
    status === "signed" ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
    : status === "sent" ? "bg-blue-600/15 text-blue-700"
    : "bg-muted text-muted-foreground";
  return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{status}</span>;
}
