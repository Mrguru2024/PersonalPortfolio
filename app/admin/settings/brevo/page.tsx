"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type BrevoStatus = {
  brevoApiKeySet: boolean;
  brevoApiKeyHint: string | null;
  fromEmail: string | null;
  fromName: string | null;
  authorizedIpsUrl: string;
  envVarHelp: { brevoApiKey: string; fromEmail: string; fromName: string };
};

export default function AdminBrevoSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/settings/brevo"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings/brevo");
      return res.json() as Promise<BrevoStatus>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const pingMutation = useMutation({
    mutationFn: async () => {
      setPingMessage(null);
      const res = await fetch("/api/admin/settings/brevo", { method: "POST", credentials: "include" });
      const j = (await res.json()) as { ok?: boolean; error?: string; message?: string; accountEmail?: string | null };
      if (!res.ok) {
        throw new Error(j.error || "Check failed");
      }
      return j;
    },
    onSuccess: (j) => {
      const msg = [j.message, j.accountEmail ? `Signed in as ${j.accountEmail}` : null].filter(Boolean).join(" ");
      setPingMessage(msg);
      toast({ title: "Brevo API reachable", description: msg || "OK" });
    },
    onError: (e: Error) => {
      setPingMessage(e.message);
      toast({ title: "Brevo check failed", description: e.message, variant: "destructive" });
    },
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin settings
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Mail className="h-7 w-7" />
          Brevo (email)
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Transactional sends (newsletters, communications test send, notifications) use Brevo. API keys and sender
          addresses are set in your host environment, not in the database.
        </p>

        {isLoading || !data ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment</CardTitle>
                <CardDescription>Values detected on the server (secrets are never shown in full).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{data.envVarHelp.brevoApiKey}</span>
                  <span className="font-medium tabular-nums">
                    {data.brevoApiKeySet ? `Set ${data.brevoApiKeyHint ?? ""}` : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{data.envVarHelp.fromEmail}</span>
                  <span className="font-medium text-right break-all">{data.fromEmail ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{data.envVarHelp.fromName}</span>
                  <span className="font-medium">{data.fromName ?? "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Authorized IPs
                </CardTitle>
                <CardDescription>
                  If Brevo reports an unrecognized IP, add your server&apos;s outbound IP here. Vercel and other hosts
                  may use rotating IPs unless you use a static egress add-on.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={data.authorizedIpsUrl} target="_blank" rel="noopener noreferrer">
                    Open Brevo authorized IPs
                    <ExternalLink className="h-3.5 w-3.5 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test API key</CardTitle>
                <CardDescription>Calls Brevo GET /v3/account. Does not send an email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => pingMutation.mutate()} disabled={pingMutation.isPending || !data.brevoApiKeySet}>
                  {pingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify API key
                </Button>
                {!data.brevoApiKeySet && (
                  <p className="text-sm text-muted-foreground">Set BREVO_API_KEY on your host, redeploy, then try again.</p>
                )}
                {pingMessage && <p className="text-sm text-foreground whitespace-pre-wrap break-words">{pingMessage}</p>}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              After changing env vars on Vercel (or locally), redeploy or restart the dev server. See{" "}
              <code className="text-foreground">.env.example</code> for all email-related variables.
            </p>

            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Refresh status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
