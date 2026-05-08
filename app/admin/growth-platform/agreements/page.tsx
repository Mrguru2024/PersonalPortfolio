"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  ExternalLink,
  FileDown,
  FileText,
  ListChecks,
  Loader2,
  PenLine,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AgreementSignaturePad } from "@/components/legal/AgreementSignaturePad";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_TYPE_HINTS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  SIGNATURE_FIELDS_BY_ROLE,
  agreementDisplayTitleFromVariables,
  type DocumentType,
} from "@shared/documentSigningEngine";

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

const WIZARD_STEP_LABELS = ["Document & client", "Scope & terms", "Milestones", "Review"] as const;

type MilestoneFormRow = { id: string; label: string; dollars: string };

function newMilestoneRow(label: string, dollars: string): MilestoneFormRow {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ?
        crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    label,
    dollars,
  };
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
  const [wizardStep, setWizardStep] = useState(0);
  const [documentType, setDocumentType] = useState<DocumentType>("agreement");
  const [documentTitleOverride, setDocumentTitleOverride] = useState("");
  const [companyLegal, setCompanyLegal] = useState("");
  const [tierHint, setTierHint] = useState("DFY");
  const [clauseSlugLine, setClauseSlugLine] = useState("");
  const [scopeBullets, setScopeBullets] = useState(
    "Install core funnel and tracking\nWeekly optimization cadence\nReporting dashboard access",
  );
  const [pricingNarrative, setPricingNarrative] = useState(
    "Milestone invoices as listed below. Ad spend billed by platforms unless otherwise scoped.",
  );
  const [milestoneRows, setMilestoneRows] = useState<MilestoneFormRow[]>(() => [
    newMilestoneRow("Deposit — kickoff", "2000"),
    newMilestoneRow("Midpoint", "1500"),
    newMilestoneRow("Prior to launch", "1500"),
  ]);
  const [startAsDraft, setStartAsDraft] = useState(false);
  const [openAgreementId, setOpenAgreementId] = useState<number | null>(null);

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

  const wizardProgress = useMemo(
    () => Math.round(((wizardStep + 1) / WIZARD_STEP_LABELS.length) * 100),
    [wizardStep],
  );

  const milestonePayload = useMemo(
    () =>
      milestoneRows
        .map((row) => ({
          label: row.label,
          amountDollars: Number(row.dollars),
        }))
        .filter((m) => m.label.trim() && Number.isFinite(m.amountDollars) && m.amountDollars > 0),
    [milestoneRows],
  );

  const canAdvanceWizard = useMemo(() => {
    if (wizardStep === 0) {
      if (!clientName.trim() || !clientEmail.trim()) return false;
      if (documentType === "custom" && !documentTitleOverride.trim()) return false;
      return true;
    }
    if (wizardStep === 2) return milestonePayload.length > 0;
    return true;
  }, [wizardStep, clientName, clientEmail, documentType, documentTitleOverride, milestonePayload.length]);

  const createMut = useMutation({
    mutationFn: async () => {
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
          documentTitleOverride: documentTitleOverride.trim() || undefined,
          companyLegalName: companyLegal.trim() || null,
          tierHint: tierHint.trim() || null,
          scopeBullets,
          pricingNarrative,
          milestones: milestonePayload,
          markSent: !startAsDraft,
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
      setWizardStep(0);
      setOpenAgreementId(data.agreement.id);
      toast({
        title: startAsDraft ? "Draft saved" : "Agreement created",
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
    <div className="mx-auto max-w-4xl space-y-6 px-3 pb-16 pt-4 fold:px-4 sm:space-y-8 sm:p-6 sm:pb-16">
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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Service agreements</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Document signing engine for contracts and agreements with client DocuSign delivery, reusable signature fields, and
          admin-side signing controls.
        </p>
      </div>

      <Card className="overflow-hidden border-border/80">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">New document</CardTitle>
              <CardDescription className="mt-1.5 max-w-xl">
                Step through client details, commercial terms, and milestones, then review. Amounts are in dollars. Leave clause
                slugs empty to use the default clause library stack.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 shrink-0">
              <Switch id="draft-mode" checked={startAsDraft} onCheckedChange={setStartAsDraft} />
              <Label htmlFor="draft-mode" className="text-xs font-normal cursor-pointer leading-snug">
                Start as draft
                <span className="block text-muted-foreground">Token link works; status stays draft until you are ready.</span>
              </Label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Step {wizardStep + 1} of {WIZARD_STEP_LABELS.length}: {WIZARD_STEP_LABELS[wizardStep]}
              </span>
              <span>{wizardProgress}%</span>
            </div>
            <Progress value={wizardProgress} className="h-2" />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {WIZARD_STEP_LABELS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                    idx === wizardStep && "bg-primary text-primary-foreground",
                    idx < wizardStep && "bg-muted text-foreground hover:bg-muted/80",
                    idx > wizardStep && "bg-muted/50 text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() => setWizardStep(idx)}
                >
                  {idx + 1}. {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 border-t border-border/60 bg-muted/10 pt-6">
          {wizardStep === 0 ?
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document type</p>
                <p className="mt-1 text-sm text-muted-foreground mb-3">
                  Choose how this file is labeled on the sign page and in PDF exports. You can override the title for any type.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {DOCUMENT_TYPES.map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setDocumentType(dt)}
                      className={cn(
                        "rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent/50",
                        documentType === dt ?
                          "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/80 bg-card",
                      )}
                    >
                      <div className="font-medium leading-tight">{DOCUMENT_TYPE_LABELS[dt]}</div>
                      <div className="mt-1 text-xs text-muted-foreground leading-snug">{DOCUMENT_TYPE_HINTS[dt]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-override">
                  {documentType === "custom" ? "Custom display title (required)" : "Display title override (optional)"}
                </Label>
                <Input
                  id="title-override"
                  value={documentTitleOverride}
                  onChange={(e) => setDocumentTitleOverride(e.target.value)}
                  placeholder={
                    documentType === "custom" ? "e.g. Strategic partnership — Q2 2026" : "Leave blank to use the preset label"
                  }
                />
                {documentType === "custom" ?
                  <p className="text-xs text-muted-foreground">Custom type needs a title clients will recognize.</p>
                : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 border-t border-border/60 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="cn" className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Client contact name
                  </Label>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tier">Tier hint</Label>
                  <Input id="tier" value={tierHint} onChange={(e) => setTierHint(e.target.value)} />
                </div>
              </div>
            </div>
          : wizardStep === 1 ?
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clauses" className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Clause slugs (optional)
                </Label>
                <Input
                  id="clauses"
                  placeholder="Comma- or space-separated, e.g. no-guarantee payment-terms"
                  value={clauseSlugLine}
                  onChange={(e) => setClauseSlugLine(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                  Scope (one bullet per line)
                </Label>
                <Textarea value={scopeBullets} onChange={(e) => setScopeBullets(e.target.value)} rows={5} />
              </div>
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Pricing narrative
                </Label>
                <Textarea value={pricingNarrative} onChange={(e) => setPricingNarrative(e.target.value)} rows={4} />
              </div>
            </div>
          : wizardStep === 2 ?
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add or remove rows. Only lines with a label and a positive amount are saved.
              </p>
              <div className="space-y-3">
                {milestoneRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/80 p-3 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Label className="text-xs">Milestone label</Label>
                      <Input
                        value={row.label}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMilestoneRows((prev) => prev.map((r, i) => (i === idx ? { ...r, label: v } : r)));
                        }}
                        placeholder="e.g. Kickoff deposit"
                      />
                    </div>
                    <div className="w-full space-y-1.5 sm:w-36">
                      <Label className="text-xs">Amount (USD)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={row.dollars}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMilestoneRows((prev) => prev.map((r, i) => (i === idx ? { ...r, dollars: v } : r)));
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={milestoneRows.length <= 1}
                      onClick={() => setMilestoneRows((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove milestone ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setMilestoneRows((prev) => [...prev, newMilestoneRow("", "0")])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add milestone
              </Button>
            </div>
          : <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-card/80 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Document</dt>
                    <dd className="font-medium">
                      {documentTitleOverride.trim() || DOCUMENT_TYPE_LABELS[documentType]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Type key</dt>
                    <dd className="font-mono text-xs">{documentType}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs">Client</dt>
                    <dd>
                      {clientName || "—"} · {clientEmail || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Initial status</dt>
                    <dd>{startAsDraft ? "Draft" : "Sent (ready to share)"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Milestones</dt>
                    <dd>
                      {milestonePayload.length} line{milestonePayload.length === 1 ? "" : "s"} · $
                      {milestonePayload.reduce((s, m) => s + m.amountDollars, 0).toLocaleString()} total
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="text-xs text-muted-foreground">
                After creation you can copy the signing link, record an admin signature, send DocuSign, and issue Stripe
                invoices from the list below.
              </p>
            </div>
          }

          <div className="flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={wizardStep === 0}
                onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              {wizardStep < WIZARD_STEP_LABELS.length - 1 ?
                <Button
                  type="button"
                  size="sm"
                  disabled={!canAdvanceWizard}
                  onClick={() => setWizardStep((s) => Math.min(WIZARD_STEP_LABELS.length - 1, s + 1))}
                >
                  Continue
                </Button>
              : null}
            </div>
            {wizardStep === WIZARD_STEP_LABELS.length - 1 ?
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => createMut.mutate()}
                disabled={
                  createMut.isPending || !clientName.trim() || !clientEmail.trim() || !canAdvanceWizard
                }
              >
                {createMut.isPending ?
                  <Loader2 className="h-4 w-4 animate-spin" />
                : startAsDraft ?
                  "Save draft"
                : "Create & mark sent"}
              </Button>
            : null}
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
            className="w-full fold:w-auto"
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
                  <span className="text-muted-foreground font-mono break-all">{r.stripeSubscriptionId}</span>
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
            <ul className="space-y-3 text-sm">
              {listQuery.data.map((b) => {
                const a = b.agreement;
                const displayTitle = agreementDisplayTitleFromVariables(a.variablesJson ?? null);
                const adminAudit = getAdminSignatureAudit(a);
                const open = openAgreementId === a.id;
                return (
                  <li key={a.id} className="min-w-0 rounded-lg border border-border/80 bg-card/30 overflow-hidden">
                    <Collapsible
                      open={open}
                      onOpenChange={(next) => setOpenAgreementId(next ? a.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-start gap-2 p-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          {open ?
                            <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium break-words">
                                #{a.id} — {displayTitle}
                              </span>
                              <BadgeInline status={a.status} />
                            </div>
                            <p className="text-xs text-muted-foreground break-words">
                              {a.clientName} · {a.clientEmail}
                            </p>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border/60 bg-muted/20 px-3 pb-3 pt-3 space-y-4">
                          <AgreementWorkflowPanel bundle={b} />
                          <p className="text-xs text-muted-foreground break-words">
                            Signing fields: {SIGNATURE_FIELDS_BY_ROLE.client.map((f) => f.label).join(", ")}
                          </p>
                          {(a.docusignEnvelopeId || a.pdfGeneratedAt || a.docusignStatus) ?
                            <p className="text-xs text-muted-foreground break-all">
                              {a.docusignEnvelopeId ? `DocuSign: ${a.docusignEnvelopeId} (${a.docusignStatus ?? "—"})` : null}
                              {a.pdfGeneratedAt ?
                                `${a.docusignEnvelopeId ? " · " : ""}PDF at ${String(a.pdfGeneratedAt).slice(0, 19)}`
                              : null}
                            </p>
                          : null}
                          {adminAudit ?
                            <p className="text-xs text-muted-foreground break-words">
                              Admin signed by {adminAudit.legalName ?? "unknown"}
                              {adminAudit.signedAt ? ` · ${new Date(adminAudit.signedAt).toLocaleString()}` : ""}
                            </p>
                          : null}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="w-full fold:w-auto justify-center" asChild>
                              <Link href={`/agreements/${a.publicToken}`} target="_blank" rel="noreferrer">
                                Open sign page
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full fold:w-auto justify-center"
                              type="button"
                              onClick={() =>
                                navigator.clipboard.writeText(`${window.location.origin}/agreements/${a.publicToken}`)
                              }
                            >
                              Copy link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full fold:w-auto justify-center"
                              type="button"
                              onClick={() => downloadAgreementPdf(a.id)}
                            >
                              <FileDown className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full fold:w-auto justify-center"
                              type="button"
                              onClick={() => openAdminSignDialog(a.id)}
                            >
                              <PenLine className="h-3 w-3 mr-1" />
                              Admin sign
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full fold:w-auto justify-center"
                              type="button"
                              onClick={() => sendDocuSign(a.id)}
                              disabled={!!a.docusignEnvelopeId}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {a.docusignEnvelopeId ? "DocuSign sent" : "DocuSign"}
                            </Button>
                          </div>
                          {b.milestones.length > 0 ?
                            <ul className="space-y-1 border-t border-border/60 pt-2 text-xs">
                              {b.milestones.map((m) => (
                                <li
                                  key={m.id}
                                  className="flex flex-col gap-2 fold:flex-row fold:items-center fold:justify-between"
                                >
                                  <span className="break-words">
                                    #{m.id} — {m.label} · ${(m.amountCents / 100).toFixed(2)} · {m.status}
                                    {m.stripeInvoiceId ? ` · ${m.stripeInvoiceId}` : ""}
                                  </span>
                                  {m.status !== "paid" ?
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-full fold:w-auto"
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
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-lg">
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
              <Label htmlFor="admin-sign-terms" className="text-sm font-normal cursor-pointer break-words">
                {SIGNATURE_FIELDS_BY_ROLE.admin.find((field) => field.key === "acceptTerms")?.label}
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="admin-sign-engagement"
                checked={adminSignAcceptEngagement}
                onCheckedChange={(checked) => setAdminSignAcceptEngagement(checked === true)}
              />
              <Label htmlFor="admin-sign-engagement" className="text-sm font-normal cursor-pointer break-words">
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

function AgreementWorkflowPanel({ bundle }: { bundle: AgreementBundle }) {
  const a = bundle.agreement;
  const adminAudit = getAdminSignatureAudit(a);
  const isDraft = a.status === "draft";
  const steps: { label: string; detail?: string; done: boolean; optional?: boolean }[] = [
    { label: "Workspace created", done: true },
    {
      label: "Shared with client",
      detail: isDraft ? "Draft — link works; flip to sent when you are ready to treat it as issued." : "Issued for client review",
      done: !isDraft,
    },
    { label: "Admin signature", detail: adminAudit?.legalName, done: !!adminAudit },
    { label: "Client signature", done: a.status === "signed" },
    {
      label: "DocuSign",
      detail: a.docusignEnvelopeId ?? undefined,
      done: !!a.docusignEnvelopeId,
      optional: true,
    },
  ];
  const ms = bundle.milestones;
  const invoiced = ms.filter((m) => m.stripeInvoiceId).length;
  const paid = ms.filter((m) => m.status === "paid").length;

  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workflow</p>
      <ul className="space-y-2.5">
        {steps.map((s) => (
          <li key={s.label} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                s.done ?
                  "border-emerald-600 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                : s.optional ?
                  "border-muted-foreground/25 text-muted-foreground"
                : "border-muted-foreground/35 text-muted-foreground",
              )}
            >
              {s.done ?
                <Check className="h-3 w-3" />
              : s.optional ?
                "—"
              : ""}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="font-medium leading-tight">
                {s.label}
                {s.optional ?
                  <span className="text-muted-foreground font-normal"> · optional</span>
                : null}
              </div>
              {s.detail ?
                <div className="text-xs text-muted-foreground break-words mt-0.5">{s.detail}</div>
              : null}
            </div>
          </li>
        ))}
      </ul>
      {ms.length > 0 ?
        <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
          Milestones: <span className="font-medium text-foreground">{paid}</span> paid ·{" "}
          <span className="font-medium text-foreground">{invoiced}</span> invoiced · {ms.length} total
        </div>
      : null}
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
