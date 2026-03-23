"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Gauge,
  ClipboardList,
  Tag,
  ExternalLink,
  Pencil,
  Loader2,
  ArrowLeft,
  FileStack,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  STARTUP_GROWTH_KIT_PATH,
  STARTUP_WEBSITE_SCORE_PATH,
  STARTUP_ACTION_PLAN_PATH,
  STARTUP_GROWTH_SYSTEM_OFFER_PATH,
  REVENUE_CALCULATOR_PATH,
} from "@/lib/funnelCtas";

const FUNNEL_ITEMS = [
  {
    id: "growth-kit",
    title: "Startup growth kit",
    description: "Educational resource: why startup sites fail, assets vs systems, 4 layers, roadmap.",
    publicPath: STARTUP_GROWTH_KIT_PATH,
    editPath: "/admin/funnel/growth-kit/edit",
    icon: BookOpen,
  },
  {
    id: "website-score",
    title: "Startup website score",
    description: "Tool: 5 questions, readiness score 0–100, suggestions, CTA to action plan.",
    publicPath: STARTUP_WEBSITE_SCORE_PATH,
    editPath: "/admin/funnel/website-score/edit",
    icon: Gauge,
  },
  {
    id: "revenue-calculator",
    title: "Revenue calculator",
    description: "Existing tool reused in funnel. No duplicate.",
    publicPath: REVENUE_CALCULATOR_PATH,
    editPath: null,
    icon: Gauge,
  },
  {
    id: "offer-audit",
    title: "Offer valuation engine",
    description: "Lead magnet offer audit with CRM capture and strategic output.",
    publicPath: "/offer-audit",
    editPath: null,
    icon: Gauge,
  },
  {
    id: "action-plan",
    title: "Startup action plan",
    description: "Five steps: clarify offer, structure homepage, capture leads, trust, conversions.",
    publicPath: STARTUP_ACTION_PLAN_PATH,
    editPath: "/admin/funnel/action-plan/edit",
    icon: ClipboardList,
  },
  {
    id: "offer",
    title: "Startup growth system offer",
    description: "Offer page: $249–$399, deliverables, CTA to strategy call. Edit text and graphics from Site offers.",
    publicPath: STARTUP_GROWTH_SYSTEM_OFFER_PATH,
    editPath: "/admin/offers/startup-growth-system/edit",
    icon: Tag,
  },
];

export default function AdminFunnelPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full min-w-0 max-w-full py-6 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground mb-2">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Startup funnel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and review startup funnel content. View live pages or open content overview for each piece.
          </p>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileStack className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">Content Library</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Upload PDFs, video, images, decks. Approve with Publish; set Members only for signed-in downloads on Free growth tools.
                </CardDescription>
              </div>
            </div>
            <Button asChild size="sm" className="shrink-0 gap-2">
              <Link href="/admin/funnel/content-library">
                <Pencil className="h-3.5 w-3.5" />
                Manage content
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6 border-border">
          <CardContent className="p-4 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">Lead intake hub</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Diagnosis reports, funnel quiz leads, and assessments in one list — import to CRM with optional AI classification.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="secondary" size="sm" className="shrink-0">
              <Link href="/admin/lead-intake">Open hub</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {FUNNEL_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="text-sm mt-0.5">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <a href={item.publicPath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View live
                    </a>
                  </Button>
                  {item.editPath && (
                    <Button asChild size="sm" className="gap-2">
                      <Link href={item.editPath}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit content
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-muted bg-muted/30">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Funnel flow:</strong> Growth kit → Website score → Revenue calculator → Action plan → Offer. Use Edit content to change copy; changes are saved and appear on the live site.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
