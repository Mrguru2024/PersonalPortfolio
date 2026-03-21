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

interface SiteOffer {
  slug: string;
  name: string;
}

export default function AscendraPreviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [offerSlug, setOfferSlug] = useState("startup-growth-system");
  const [landingResult, setLandingResult] = useState<Record<string, unknown> | null>(null);
  const [dmText, setDmText] = useState("");
  const [dmPersona, setDmPersona] = useState("");
  const [dmResult, setDmResult] = useState<Record<string, unknown> | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml, setEmailHtml] = useState("<p>Hello {{name}},</p>");
  const [emailResult, setEmailResult] = useState<Record<string, unknown> | null>(null);
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
      const j = await res.json();
      if (!res.ok) throw new Error((j as { error?: string }).error || "Failed");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ascendra-intelligence">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Hub
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Eye className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Preview</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Internal snapshots only. Landing pulls from <code className="text-xs bg-muted px-1 rounded">site_offers</code>.
        </p>

        <Tabs defaultValue="landing">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="landing">Landing</TabsTrigger>
            <TabsTrigger value="dm">DM</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="landing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offer page snapshot</CardTitle>
                <CardDescription>Hero, CTA, bullets from stored sections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Offer</Label>
                  <Select value={offerSlug} onValueChange={setOfferSlug}>
                    <SelectTrigger>
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
                <Button onClick={runLanding} disabled={loading || !offerSlug}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Run preview
                </Button>
                {landingResult && (
                  <pre className="text-xs bg-muted/80 dark:bg-muted p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(landingResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dm" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DM text</CardTitle>
                <CardDescription>Normalizes whitespace and counts characters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Optional persona label</Label>
                  <Input value={dmPersona} onChange={(e) => setDmPersona(e.target.value)} placeholder="e.g. Marcus" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea rows={8} value={dmText} onChange={(e) => setDmText(e.target.value)} />
                </div>
                <Button onClick={runDm} disabled={loading}>
                  Preview
                </Button>
                {dmResult && (
                  <pre className="text-xs bg-muted/80 p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(dmResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email</CardTitle>
                <CardDescription>Strips script tags; shows plain-text preview excerpt only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>HTML</Label>
                  <Textarea rows={10} value={emailHtml} onChange={(e) => setEmailHtml(e.target.value)} />
                </div>
                <Button onClick={runEmail} disabled={loading}>
                  Preview
                </Button>
                {emailResult && (
                  <pre className="text-xs bg-muted/80 p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(emailResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
