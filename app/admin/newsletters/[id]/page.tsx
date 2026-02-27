"use client";

import { useAuth } from "@/hooks/use-auth";
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
}

export default function NewsletterViewPage() {
  const { user, isLoading: authLoading } = useAuth();
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

  const [recipientMode, setRecipientMode] = useState<"subscribers" | "list">("subscribers");
  const [recipientList, setRecipientList] = useState<string>("");
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [selectedCrmEmails, setSelectedCrmEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (newsletter?.recipientEmails && newsletter.recipientEmails.length > 0) {
      setRecipientMode("list");
      setRecipientList(newsletter.recipientEmails.join("\n"));
    }
  }, [newsletter?.recipientEmails]);

  const { data: crmContacts = [] } = useQuery<{ id: number; email: string; name: string }[]>({
    queryKey: ["/api/admin/crm/contacts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/contacts");
      return res.json();
    },
    enabled: crmModalOpen,
  });

  const saveRecipientsMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const res = await apiRequest("PATCH", `/api/admin/newsletters/${newsletterId}`, {
        recipientEmails: emails.length > 0 ? emails : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters", newsletterId] });
      toast({ title: "Recipients saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save recipients", description: e.message, variant: "destructive" }),
  });

  const saveRecipients = () => {
    if (recipientMode === "subscribers") {
      saveRecipientsMutation.mutate([]);
      return;
    }
    const emails = recipientList
      .split(/\n/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    saveRecipientsMutation.mutate([...new Set(emails)]);
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
    <div className="container mx-auto px-4 py-10 max-w-5xl">
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
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>
                Choose who receives this newsletter. Use &quot;Specific list&quot; for bulk paste or CRM contacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "subscribers"}
                    onChange={() => setRecipientMode("subscribers")}
                    className="rounded-full"
                  />
                  <span>All subscribers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === "list"}
                    onChange={() => setRecipientMode("list")}
                    className="rounded-full"
                  />
                  <span>Specific list (bulk / CRM)</span>
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
                      className="mt-1 min-h-[120px] font-mono text-sm"
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
            <DialogDescription>Select contacts to add their emails to the recipient list.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto space-y-2 flex-1 min-h-0">
            {crmContacts.map((c) => (
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
                <span className="text-muted-foreground text-sm">{c.email}</span>
              </label>
            ))}
            {crmContacts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No CRM contacts. Add leads or clients in CRM first.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setCrmModalOpen(false)}>Cancel</Button>
            <Button onClick={addFromCrm}>Add selected</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
