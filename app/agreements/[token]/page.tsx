"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgreementSignaturePad } from "@/components/legal/AgreementSignaturePad";
import { AscendraBehaviorMount } from "@/components/tracking/AscendraBehaviorMount";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@shared/documentSigningEngine";

type AgreementPayload = {
  publicToken: string;
  status: string;
  documentType?: DocumentType;
  clientName: string;
  htmlBody: string;
  signatureFields?: Array<{ key: string; label: string; required: boolean }>;
  milestones: Array<{ id: number; label: string; amountCents: number; status: string }>;
  signedAt: string | null;
  signerLegalName: string | null;
};

export default function AgreementSignPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const [data, setData] = useState<AgreementPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [legalName, setLegalName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptEngagement, setAcceptEngagement] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [termsLabel, setTermsLabel] = useState("I have read and agree to the Terms of Service.");
  const [engagementLabel, setEngagementLabel] = useState(
    "I understand the service engagement expectations (no guaranteed results, cooperation, media spend, third-party risk).",
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agreements/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setError("This agreement link is invalid or expired.");
        setData(null);
        return;
      }
      const payload = (await res.json()) as AgreementPayload;
      setData(payload);
      const fields = payload?.signatureFields ?? [];
      const termsField = fields.find((field) => field.key === "acceptTerms");
      const engagementField = fields.find((field) => field.key === "acceptEngagement");
      if (termsField?.label) setTermsLabel(termsField.label);
      if (engagementField?.label) setEngagementLabel(engagementField.label);
    } catch {
      setError("Could not load agreement.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !data) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/agreements/${encodeURIComponent(token)}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName,
          acceptTerms,
          acceptEngagement,
          signatureImageBase64: sig,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error === "consent_required" ? "Confirm both checkboxes." : j.error ?? "Sign failed.");
        return;
      }
      setDone(true);
      void load();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AscendraBehaviorMount />
      <div className="container max-w-3xl mx-auto px-3 py-6 space-y-5 fold:px-4 fold:py-8 sm:py-10 sm:space-y-6">
      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/terms">Terms</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/service-engagement">Engagement terms</Link>
          </Button>
        </div>

        {loading ?
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        : error && !data ?
          <Card>
            <CardHeader>
              <CardTitle>Agreement</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        : data ?
          <>
            <Card>
              <CardHeader>
                <CardTitle className="break-words text-lg sm:text-xl">
                  {DOCUMENT_TYPE_LABELS[data.documentType ?? "agreement"]} for {data.clientName}
                </CardTitle>
                <CardDescription>
                  Review the generated summary below. Electronic signature records your typed legal name, optional drawn
                  signature, consent checkboxes, and a server audit digest (not a third-party e-sign vendor).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border bg-card p-3 fold:p-4 max-h-[60vh] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: data.htmlBody }}
                />
              </CardContent>
            </Card>

            {data.milestones.length > 0 ?
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Milestones (billing)</CardTitle>
                  <CardDescription>Invoices are issued from the admin workspace after signature when ready.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2">
                    {data.milestones.map((m) => (
                      <li key={m.id} className="flex flex-col gap-1 border-b border-border/60 pb-2 fold:flex-row fold:justify-between fold:gap-2">
                        <span className="break-words">{m.label}</span>
                        <span className="tabular-nums">
                          ${(m.amountCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} — {m.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            : null}

            {data.status === "signed" || done ?
              <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-base text-emerald-700 dark:text-emerald-400">Signed</CardTitle>
                  <CardDescription>
                    {data.signerLegalName ? <>Recorded for: {data.signerLegalName}</> : "Signature recorded."}
                    {data.signedAt ?
                      <> · {new Date(data.signedAt).toLocaleString()}</>
                    : null}
                  </CardDescription>
                </CardHeader>
              </Card>
            :
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sign electronically</CardTitle>
                  <CardDescription>
                    Type your full legal name as it should appear on the agreement and confirm the two acknowledgments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="legal-name">Full legal name</Label>
                      <Input
                        id="legal-name"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                    <AgreementSignaturePad onChange={setSig} />
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(v) => setAcceptTerms(v === true)}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal leading-snug cursor-pointer break-words">
                        {termsLabel}{" "}
                        <Link href="/terms" className="text-primary underline-offset-4 hover:underline" target="_blank">
                          (open terms)
                        </Link>
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="eng"
                        checked={acceptEngagement}
                        onCheckedChange={(v) => setAcceptEngagement(v === true)}
                      />
                      <Label htmlFor="eng" className="text-sm font-normal leading-snug cursor-pointer break-words">
                        {engagementLabel}{" "}
                        <Link
                          href="/service-engagement"
                          className="text-primary underline-offset-4 hover:underline"
                          target="_blank"
                        >
                          (open engagement expectations)
                        </Link>{" "}
                      </Label>
                    </div>
                    {error ?
                      <p className="text-sm text-destructive">{error}</p>
                    : null}
                    <Button type="submit" className="w-full fold:w-auto" disabled={submitting}>
                      {submitting ?
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting…
                        </>
                      : "Sign agreement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            }
          </>
        : null}
      </div>
    </div>
  );
}
