"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  DmRichPreview,
  EmailRichPreview,
  LandingOfferPreview,
  type DmPreviewData,
  type EmailPreviewData,
  type LandingPreviewData,
} from "./preview-rich-views";

interface SiteOffer {
  slug: string;
  name: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickError(r: unknown): string | undefined {
  if (!isRecord(r)) return undefined;
  return typeof r.error === "string" ? r.error : undefined;
}

export default function AscendraPreviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [offerSlug, setOfferSlug] = useState("startup-growth-system");
  const [landingResult, setLandingResult] = useState<unknown>(null);
  const [dmText, setDmText] = useState("");
  const [dmPersona, setDmPersona] = useState("");
  const [dmResult, setDmResult] = useState<unknown>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("<p>Hello {{name}},</p>");
  const [emailResult, setEmailResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: offersData } = useQuery<{ offers: SiteOffer[] }>({
    queryKey: ["/api/admin/offers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/offers");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  async function runLanding() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/preview", {
        mode: "landing",
        offerSlug,
      });
      const j = await res.json();
      if (!res.ok) throw new Error((j as { error?: string }).error || "Failed");
      setLandingResult(j);
    } catch {
      setLandingResult({ error: "Could not load offer" });
    } finally {
      setLoading(false);
    }
  }

  async function runDm() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/preview", {
        mode: "dm",
        text: dmText,
        personaDisplayName: dmPersona || undefined,
      });
      const j = await res.json();
      if (!res.ok) throw new Error((j as { error?: string }).error || "Failed");
      setDmResult(j);
    } catch {
      setDmResult({ error: "Preview failed" });
    } finally {
      setLoading(false);
    }
  }

  async function runEmail() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/preview", {
        mode: "email",
        html: emailHtml,
        subject: emailSubject || undefined,
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok) throw new Error((j as { error?: string }).error || "Failed");
      if (typeof j.htmlSanitized !== "string") {
        j.htmlSanitized = "";
      }
      setEmailResult(j);
    } catch {
      setEmailResult({ error: "Preview failed" });
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const offers = offersData?.offers ?? [];

  const landingErr = pickError(landingResult);
  const landingData =
    !landingErr && isRecord(landingResult) && landingResult.mode === "landing"
      ? (landingResult as LandingPreviewData)
      : null;

  const dmErr = pickError(dmResult);
  const dmData =
    !dmErr && isRecord(dmResult) && dmResult.mode === "dm"
      ? (dmResult as DmPreviewData)
      : null;

  const emailErr = pickError(emailResult);
  const emailData =
    !emailErr && isRecord(emailResult) && emailResult.mode === "email"
      ? (emailResult as EmailPreviewData)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-primary/[0.03] dark:to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ascendra-intelligence">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Hub
          </Link>
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Eye className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Preview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Rich previews for landing, DM, and email — internal use only.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Landing pulls hero, bullets, and CTA from <code className="text-xs bg-muted px-1 rounded">site_offers</code>.
            Email HTML is shown in a sandboxed frame after script tags are removed on the server.
          </p>
        </div>

        <Tabs defaultValue="landing" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/60">
            <TabsTrigger value="landing" className="data-[state=active]:shadow-sm">
              Landing
            </TabsTrigger>
            <TabsTrigger value="dm" className="data-[state=active]:shadow-sm">
              DM
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:shadow-sm">
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="landing" className="mt-0 focus-visible:outline-none">
            <Card className="border-border/80 shadow-lg shadow-black/[0.03] dark:shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">Offer page snapshot</CardTitle>
                <CardDescription>
                  High-fidelity hero layout, bullets, CTAs, and SEO strip — not raw JSON.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <Label>Offer</Label>
                    <Select value={offerSlug} onValueChange={setOfferSlug}>
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Select slug" />
                      </SelectTrigger>
                      <SelectContent>
                        {offers.map((o) => (
                          <SelectItem key={o.slug} value={o.slug}>
                            {o.name} ({o.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={runLanding} disabled={loading || !offerSlug} className="shrink-0">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Run preview
                  </Button>
                </div>
                {landingResult ? (
                  <LandingOfferPreview data={landingData} error={landingErr} />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dm" className="mt-0 focus-visible:outline-none">
            <Card className="border-border/80 shadow-lg shadow-black/[0.03] dark:shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">DM preview</CardTitle>
                <CardDescription>
                  Device-style frame with normalized message and character count.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Optional persona label</Label>
                    <Input
                      value={dmPersona}
                      onChange={(e) => setDmPersona(e.target.value)}
                      placeholder="e.g. Marcus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    rows={8}
                    value={dmText}
                    onChange={(e) => setDmText(e.target.value)}
                    className="resize-y min-h-[160px]"
                  />
                </div>
                <Button onClick={runDm} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Preview
                </Button>
                {dmResult ? <DmRichPreview data={dmData} error={dmErr} /> : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-0 focus-visible:outline-none">
            <Card className="border-border/80 shadow-lg shadow-black/[0.03] dark:shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">Email preview</CardTitle>
                <CardDescription>
                  Inbox-style header, rendered HTML in a sandboxed iframe, plus plain-text excerpt.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>HTML</Label>
                  <Textarea
                    rows={10}
                    value={emailHtml}
                    onChange={(e) => setEmailHtml(e.target.value)}
                    className="resize-y font-mono text-sm"
                  />
                </div>
                <Button onClick={runEmail} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Preview
                </Button>
                {emailResult ? <EmailRichPreview data={emailData} error={emailErr} /> : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
