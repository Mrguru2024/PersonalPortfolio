"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Video,
  Link2,
  Briefcase,
  CircleDollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tools = [
  {
    title: "Discovery workspaces",
    description: "Prep notes, fit/readiness, and outcomes. View recent workspaces or open one from any lead.",
    href: "/admin/crm/discovery",
    icon: Video,
  },
  {
    title: "Zoom & connections",
    description: "Connect Zoom and test the integration for scheduling and logging meetings from CRM.",
    href: "/admin/integrations#integration-zoom",
    icon: Link2,
  },
  {
    title: "Proposal prep",
    description: "Move qualified opportunities toward closed-won with profitability context.",
    href: "/admin/crm/proposal-prep",
    icon: Briefcase,
  },
  {
    title: "LTV & revenue reports",
    description: "Run filtered pipeline and client-estimate reports with parameters and CSV export.",
    href: "/admin/crm/ltv",
    icon: CircleDollarSign,
  },
  {
    title: "CRM contacts",
    description: "Open any lead to create a discovery workspace, schedule Zoom, and log the call.",
    href: "/admin/crm",
    icon: Users,
  },
];

export default function DiscoveryToolsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-3xl py-8 px-4">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            CRM home
          </Link>
        </Button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Discovery toolkit</h1>
          <p className="text-muted-foreground mt-1">
            Zoom, discovery call prep, and handoff to proposals—reachable from one place in the admin nav.
          </p>
        </div>
        <div className="space-y-4">
          {tools.map(({ title, description, href, icon: Icon }) => (
            <Card key={href} className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                  <Button variant="link" className="h-auto p-0 mt-3 text-primary" asChild>
                    <Link href={href}>Open</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
