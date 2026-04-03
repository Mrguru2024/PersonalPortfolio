"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Inbox, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminPushSubscribeButton } from "@/components/admin/AdminPushSubscribeButton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isAuthApprovedAdmin } from "@/lib/super-admin";

type InboxItem = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  linkUrl: string;
  relatedType: string | null;
  relatedId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  isRead: boolean;
};

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    contact: "Contact",
    quote: "Quote",
    resume: "Resume",
    assessment: "Assessment",
    free_lead: "Free tools lead",
    data_deletion: "Data deletion",
    blog_comment: "Blog comment",
    offer_valuation: "Offer valuation",
    growth_funnel: "Growth funnel",
    skill_endorsement: "Skill endorsement",
    client_feedback: "Client feedback",
    newsletter_subscribe: "Newsletter",
    market_score: "Market Score",
  };
  return map[kind] ?? kind;
}

function AdminInboxContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [detail, setDetail] = useState<InboxItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const itemParam = searchParams.get("item");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth?redirect=/admin/inbox");
    else if (!authLoading && user && !isAuthApprovedAdmin(user)) router.replace("/");
  }, [user, authLoading, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/inbox", "full"],
    queryFn: async () => {
      const res = await fetch("/api/admin/inbox?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load inbox");
      return res.json() as Promise<{ items: InboxItem[]; unreadCount: number }>;
    },
    enabled: !!user && isAuthApprovedAdmin(user ?? null),
    refetchInterval: 45_000,
  });

  const openItem = useCallback(
    async (id: number, opts?: { updateUrl?: boolean }) => {
      try {
        const res = await fetch(`/api/admin/inbox/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Not found");
        const json = (await res.json()) as { item: InboxItem };
        setDetail({ ...json.item, isRead: true });
        setSheetOpen(true);
        if (opts?.updateUrl !== false) {
          router.replace(`/admin/inbox?item=${id}`, { scroll: false });
        }
        void queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox"] });
      } catch {
        toast({ title: "Could not open item", variant: "destructive" });
      }
    },
    [queryClient, router, toast],
  );

  useEffect(() => {
    if (!itemParam || !user || !isAuthApprovedAdmin(user)) return;
    const id = Number(itemParam);
    if (!Number.isFinite(id) || id < 1) return;
    void openItem(id, { updateUrl: false });
  }, [itemParam, user, openItem]);

  const readAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/inbox/read-all", {});
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox"] });
      toast({ title: "All marked read" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  if (authLoading || !user || !isAuthApprovedAdmin(user)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-6 max-w-3xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Inbound inbox
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="ml-1">
                {unreadCount} new
              </Badge>
            ) : null}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminPushSubscribeButton size="sm" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readAllMutation.isPending || items.length === 0}
            onClick={() => readAllMutation.mutate()}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How this works</CardTitle>
          <CardDescription>
            Every site form and lead tool logs here (and sends browser push when VAPID keys are set and
            you subscribe). Use it when email is delayed or missed — the row still lands in the database.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? (
        <p className="text-destructive text-sm">Failed to load inbox. Refresh and try again.</p>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No inbound items yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => void openItem(row.id)}
                className={`w-full text-left rounded-lg border p-4 transition hover:bg-muted/50 ${
                  !row.isRead ? "border-primary/40 bg-muted/30" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{kindLabel(row.kind)}</Badge>
                  <span className="font-medium">{row.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                {row.body ? (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap">
                    {row.body}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setDetail(null);
            router.replace("/admin/inbox", { scroll: false });
          }
        }}
      >
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto"
          accessibilityTitle={detail ? undefined : "Admin inbox item"}
        >
          {detail ? (
            <>
              <SheetHeader>
                <SheetDescription>{kindLabel(detail.kind)}</SheetDescription>
                <SheetTitle className="text-left">{detail.title}</SheetTitle>
                <p className="text-xs text-muted-foreground text-left">
                  {format(new Date(detail.createdAt), "PPpp")}
                </p>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                {detail.body ? (
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">
                    {detail.body}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No message body stored.</p>
                )}
                {detail.metadata && Object.keys(detail.metadata).length > 0 ? (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Technical metadata</summary>
                    <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-[11px]">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  </details>
                ) : null}
                <Button asChild variant="default" className="w-full sm:w-auto">
                  <Link href={detail.linkUrl}>
                    Open linked admin view
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/dashboard?tab=contacts#admin-dashboard-inbox-tabs">
                      Contacts tab
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/crm">CRM</Link>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminInboxContent />
    </Suspense>
  );
}
