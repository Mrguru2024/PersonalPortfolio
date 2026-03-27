"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Send, Edit, Mail, Users, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Newsletter {
  id: number;
  subject: string;
  previewText?: string;
  content: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  recipientEmails?: string[] | null;
  recipientFilter?: {
    tags?: string[];
    subscribed?: boolean;
    crmLeads?: boolean;
    crmClients?: boolean;
  } | null;
}

export default function NewsletterViewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isSuperUser = isAuthSuperUser(user);
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const newsletterId = parseInt(params?.id as string);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: newsletter, isLoading } = useQuery<Newsletter>({
    queryKey: ["/api/admin/newsletters", newsletterId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/newsletters/${newsletterId}`);
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!newsletterId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/newsletters/${newsletterId}/send`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters", newsletterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
      toast({
        title: "Newsletter Sent",
        description: `Sent to ${data.sent} subscribers. ${data.failed > 0 ? `${data.failed} failed.` : ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    },
  });

  const [recipientMode, setRecipientMode] = useState<
    "subscribers" | "list" | "crm_leads" | "crm_clients"
  >("subscribers");
  const [recipientList, setRecipientList] = useState<string>("");
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [crmFilter, setCrmFilter] = useState<"all" | "lead" | "client">("all");
  const [selectedCrmEmails, setSelectedCrmEmails] = useState<Set<string>>(new Set());

  const recipientEmailsJson = JSON.stringify(newsletter?.recipientEmails ?? null);
  const crmLeadsSelected = newsletter?.recipientFilter?.crmLeads === true;
  const crmClientsSelected = newsletter?.recipientFilter?.crmClients === true;

  useEffect(() => {
    if (!newsletter) return;
    const emails = newsletter.recipientEmails;
    if (emails && Array.isArray(emails) && emails.length > 0) {
      setRecipientMode("list");
      setRecipientList(emails.join("\n"));
      return;
    }
    const f = newsletter.recipientFilter;
    if (f?.crmLeads === true) {
      setRecipientMode("crm_leads");
      setRecipientList("");
      return;
    }
    if (f?.crmClients === true) {
      setRecipientMode("crm_clients");
      setRecipientList("");
      return;
    }
    setRecipientMode("subscribers");
    setRecipientList("");
  }, [newsletter, newsletterId, recipientEmailsJson, crmLeadsSelected, crmClientsSelected]);

  const { data: crmContacts = [] } = useQuery<{ id: number; email: string; name: string; type?: string }[]>({
    queryKey: ["/api/admin/crm/contacts", crmFilter],
    queryFn: async () => {
      const q = crmFilter === "all" ? "" : `?type=${crmFilter}`;
      const res = await apiRequest("GET", `/api/admin/crm/contacts${q}`);
      return res.json();
    },
    enabled: crmModalOpen,
  });

  const saveRecipientsMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const baseFilter = newsletter?.recipientFilter ?? {};
      const res = await apiRequest("PATCH", `/api/admin/newsletters/${newsletterId}`, {
        recipientEmails: emails.length > 0 ? emails : null,
        recipientFilter: {
          ...baseFilter,
          crmLeads: false,
          crmClients: false,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters", newsletterId] });
      toast({ title: "Recipients saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save recipients", description: e.message, variant: "destructive" }),
  });

  const saveAudienceMutation = useMutation({
    mutationFn: async (body: { recipientEmails: null; recipientFilter: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/admin/newsletters/${newsletterId}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters", newsletterId] });
      toast({ title: "Audience updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to save audience", description: e.message, variant: "destructive" }),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved || !newsletter) {
    return null;
  }

  const saveRecipients = () => {
    const emails = recipientList
      .split(/\n/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    saveRecipientsMutation.mutate([...new Set(emails)]);
  };

  const applySubscribersAudience = () => {
    const baseFilter = newsletter?.recipientFilter ?? {};
    saveAudienceMutation.mutate({
      recipientEmails: null,
      recipientFilter: { ...baseFilter, crmLeads: false, crmClients: false },
    });
  };

  const applyCrmLeadsAudience = () => {
    const baseFilter = newsletter?.recipientFilter ?? {};
    saveAudienceMutation.mutate({
      recipientEmails: null,
      recipientFilter: { ...baseFilter, crmLeads: true, crmClients: false },
    });
  };

  const applyCrmClientsAudience = () => {
    const baseFilter = newsletter?.recipientFilter ?? {};
    saveAudienceMutation.mutate({
      recipientEmails: null,
      recipientFilter: { ...baseFilter, crmLeads: false, crmClients: true },
    });
  };

  const addFromCrm = () => {
    const current = recipientList
      .split(/\n/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const added = [...new Set([...current, ...selectedCrmEmails])];
    setRecipientList(added.join("\n"));
    setSelectedCrmEmails(new Set());
    setCrmModalOpen(false);
  };

  const addAllCrmShown = () => {
    const emails = crmContacts
      .map((c) => c.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e));
    const current = recipientList
      .split(/\n/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    setRecipientList([...new Set([...current, ...emails])].join("\n"));
    setSelectedCrmEmails(new Set());
    setCrmModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      scheduled: "secondary",
      sending: "secondary",
      sent: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-10 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/newsletters">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletters
          </Link>
        </Button>
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">{newsletter.subject}</h1>
              {getStatusBadge(newsletter.status)}
            </div>
            <p className="text-muted-foreground">
              Created {format(new Date(newsletter.createdAt), "PPp")}
              {newsletter.sentAt && (
                <> • Sent {format(new Date(newsletter.sentAt), "PPp")}</>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {newsletter.status === "draft" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/admin/newsletters/${newsletterId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {newsletter.status === "draft" && (
          <Alert>
            <AlertTitle>How to send</AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              <p>
                1. Choose who gets this email below (subscribers, all CRM leads/clients, or a specific list). For a
                custom list, pick &quot;Specific list&quot;, add emails, then click <strong>Save recipients</strong>.
              </p>
              <p>
                2. Use <strong>Send Now</strong> in the header when you are ready.{" "}
                {isSuperUser ? (
                  <>
                    Merge tags in subject or body:{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{{firstName}}"}</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{{Name}}"}</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{{company}}"}</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{{email}}"}</code> — filled from CRM when the address
                    matches a contact.
                  </>
                ) : (
                  <>
                    You can personalize the subject and body with names and company when the email matches someone in
                    your CRM.
                  </>
                )}
              </p>
              <p>
                {isSuperUser ? (
                  <>
                    If Brevo blocks the send (e.g. unrecognized IP), open{" "}
                    <Link href="/admin/settings/brevo" className="underline font-medium text-foreground">
                      Admin → Settings → Brevo
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    If something prevents delivery, an administrator can check email settings under{" "}
                    <Link href="/admin/settings/brevo" className="underline font-medium text-foreground">
                      Admin → Settings → Brevo
                    </Link>
                    .
                  </>
                )}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {newsletter.status === "draft" && (
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>
                Send to newsletter subscribers, every CRM lead or client with an email, or a pasted list. CRM segment
                choices apply as soon as you select them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "subscribers"}
                    onChange={() => {
                      setRecipientMode("subscribers");
                      applySubscribersAudience();
                    }}
                    disabled={saveAudienceMutation.isPending}
                    className="rounded-full"
                  />
                  <span>All subscribers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "crm_leads"}
                    onChange={() => {
                      setRecipientMode("crm_leads");
                      applyCrmLeadsAudience();
                    }}
                    disabled={saveAudienceMutation.isPending}
                    className="rounded-full"
                  />
                  <span>All CRM leads (every lead contact with email)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "crm_clients"}
                    onChange={() => {
                      setRecipientMode("crm_clients");
                      applyCrmClientsAudience();
                    }}
                    disabled={saveAudienceMutation.isPending}
                    className="rounded-full"
                  />
                  <span>All CRM clients (every client contact with email)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "list"}
                    onChange={() => setRecipientMode("list")}
                    className="rounded-full"
                  />
                  <span>Specific list (bulk paste or pick from CRM)</span>
                </label>
              </div>
              {recipientMode === "list" && (
                <>
                  <div>
                    <Label>Emails (one per line)</Label>
                    <Textarea
                      value={recipientList}
                      onChange={(e) => setRecipientList(e.target.value)}
                      placeholder="one@example.com&#10;two@example.com"
                      className="mt-1 min-h-[120px] text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCrmModalOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Add from CRM
                    </Button>
                    <Button type="button" size="sm" onClick={saveRecipients} disabled={saveRecipientsMutation.isPending}>
                      {saveRecipientsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save recipients"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {newsletter.previewText && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Text</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{newsletter.previewText}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_blockquote]:text-muted-foreground [&_code]:text-foreground [&_pre]:text-foreground [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: newsletter.content }}
            />
          </CardContent>
        </Card>

        {newsletter.status === "sent" && (
          <Card>
            <CardHeader>
              <CardTitle>Send Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{newsletter.totalRecipients}</div>
                  <div className="text-sm text-muted-foreground">Total Recipients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{newsletter.sentCount}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
                {newsletter.failedCount > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-red-600">{newsletter.failedCount}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={crmModalOpen} onOpenChange={setCrmModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add from CRM</DialogTitle>
            <DialogDescription>
              Filter by lead or client, select rows, or add every email in the current filter to the list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 pb-2">
            {(["all", "lead", "client"] as const).map((key) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={crmFilter === key ? "secondary" : "outline"}
                onClick={() => setCrmFilter(key)}
              >
                {key === "all" ? "All" : key === "lead" ? "Leads only" : "Clients only"}
              </Button>
            ))}
          </div>
          <div className="overflow-y-auto space-y-2 flex-1 min-h-0">
            {crmContacts
              .filter((c) => c.email?.trim())
              .map((c) => (
                <label key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={selectedCrmEmails.has(c.email)}
                    onCheckedChange={(checked) => {
                      setSelectedCrmEmails((prev) => {
                        const next = new Set(prev);
                        if (checked) next.add(c.email);
                        else next.delete(c.email);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm">{c.name}</span>
                  <span className="text-muted-foreground text-sm truncate">{c.email}</span>
                  {c.type && (
                    <Badge variant="outline" className="ml-auto shrink-0 text-xs capitalize">
                      {c.type}
                    </Badge>
                  )}
                </label>
              ))}
            {crmContacts.filter((c) => c.email?.trim()).length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                No contacts with email in this filter. Add leads or clients in CRM first.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setCrmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" type="button" onClick={addAllCrmShown}>
              Add all shown
            </Button>
            <Button onClick={addFromCrm}>Add selected</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
