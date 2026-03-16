"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, ArrowLeft, User, Target, FileText, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CrmAccount {
  id: number;
  name: string;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  businessType?: string | null;
  companySize?: string | null;
  estimatedRevenueRange?: string | null;
  location?: string | null;
  accountStatus?: string | null;
  notesSummary?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface CrmContact {
  id: number;
  name: string;
  email: string;
  jobTitle?: string | null;
}

interface DealWithContact {
  id: number;
  title: string;
  value: number;
  pipelineStage?: string | null;
  contact?: { name: string };
}

interface ResearchProfile {
  id: number;
  companySummary?: string | null;
  suggestedServiceFit?: string | null;
  researchConfidence?: string | null;
}

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  content?: string | null;
  createdAt: string;
}

export default function CrmAccountDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: account, isLoading: accountLoading } = useQuery<CrmAccount>({
    queryKey: ["/api/admin/crm/accounts", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/accounts/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !Number.isNaN(id),
  });

  const { data: contacts = [] } = useQuery<CrmContact[]>({
    queryKey: ["/api/admin/crm/contacts", "accountId", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts?accountId=${id}`);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !Number.isNaN(id),
  });

  const { data: deals = [] } = useQuery<DealWithContact[]>({
    queryKey: ["/api/admin/crm/deals", "accountId", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/deals?accountId=${id}`);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !Number.isNaN(id),
  });

  const { data: research } = useQuery<ResearchProfile | null>({
    queryKey: ["/api/admin/crm/research-profiles", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/research-profiles?accountId=${id}`);
      const list = await res.json();
      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !Number.isNaN(id),
  });

  const { data: activity = [] } = useQuery<ActivityItem[]>({
    queryKey: ["/api/admin/crm/activity-log", "accountId", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/activity-log?accountId=${id}`);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !Number.isNaN(id),
  });

  if (authLoading || !user) return null;
  if (accountLoading && !account) return <p className="p-6">Loading…</p>;
  if (!account) return <p className="p-6">Account not found.</p>;

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/crm/accounts"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {[account.industry, account.companySize].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {account.accountStatus && <Badge variant="secondary">{account.accountStatus}</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {account.website && <p><span className="text-muted-foreground">Website:</span> <a href={account.website} target="_blank" rel="noreferrer" className="text-primary underline">{account.website}</a></p>}
            {account.location && <p><span className="text-muted-foreground">Location:</span> {account.location}</p>}
            {account.businessType && <p><span className="text-muted-foreground">Business type:</span> {account.businessType}</p>}
            {account.estimatedRevenueRange && <p><span className="text-muted-foreground">Revenue:</span> {account.estimatedRevenueRange}</p>}
            {account.notesSummary && <p className="pt-2">{account.notesSummary}</p>}
            {account.tags && account.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {account.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Contacts</CardTitle>
            <CardDescription>{contacts.length} linked</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts linked.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/crm/${c.id}`} className="text-primary hover:underline font-medium">{c.name}</Link>
                    <span className="text-muted-foreground text-sm"> — {c.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Leads</CardTitle>
            <CardDescription>{deals.length} opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads linked.</p>
            ) : (
              <ul className="space-y-2">
                {deals.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/crm?dealId=${d.id}`} className="text-primary hover:underline font-medium">{d.title}</Link>
                    <span className="text-muted-foreground text-sm"> — {d.contact?.name ?? "—"} · ${(d.value / 100).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Research</CardTitle>
            <CardDescription>{research ? "Profile exists" : "No research yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            {research ? (
              <div className="text-sm space-y-1">
                {research.companySummary && <p>{research.companySummary.slice(0, 200)}{research.companySummary.length > 200 ? "…" : ""}</p>}
                {research.suggestedServiceFit && <p><span className="text-muted-foreground">Fit:</span> {research.suggestedServiceFit}</p>}
                {research.researchConfidence && <Badge variant="secondary">{research.researchConfidence}</Badge>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add a research profile to capture findings and suggested outreach.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground ml-2">{format(new Date(a.createdAt), "MMM d, HH:mm")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/crm/accounts">← Accounts</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/crm/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
