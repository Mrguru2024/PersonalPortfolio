"use client";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewsletterPreviewDialog } from "@/components/newsletter/NewsletterPreviewDialog";

interface Newsletter {
  id: number;
  subject: string;
  previewText?: string | null;
  content: string;
  status: string;
  createdAt: string;
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    scheduled: "secondary",
    sending: "secondary",
    sent: "default",
    failed: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function EditNewsletterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const newsletterId = Number(params?.id);
  const hasValidId = Number.isFinite(newsletterId) && newsletterId > 0;

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const {
    data: newsletter,
    isLoading,
    error,
  } = useQuery<Newsletter>({
    queryKey: ["/api/admin/newsletters", newsletterId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/newsletters/${newsletterId}`);
      return response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && hasValidId,
  });

  useEffect(() => {
    setIsInitialized(false);
  }, [newsletterId]);

  useEffect(() => {
    if (!newsletter || isInitialized) return;
    setSubject(newsletter.subject || "");
    setPreviewText(newsletter.previewText || "");
    setContent(newsletter.content || "");
    setIsInitialized(true);
  }, [newsletter, isInitialized]);

  const canSave = useMemo(() => {
    if (!newsletter || newsletter.status !== "draft") return false;
    return subject.trim().length > 0 && content.trim().length > 0;
  }, [newsletter, subject, content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      const response = await apiRequest("PATCH", `/api/admin/newsletters/${newsletterId}`, {
        subject: subject.trim(),
        previewText: previewText.trim() || null,
        content,
        plainText,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters", newsletterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
      toast({
        title: "Newsletter updated",
        description: "Your draft changes were saved.",
      });
      router.push(`/admin/newsletters/${newsletterId}`);
    },
    onError: (saveError: Error) => {
      toast({
        title: "Failed to save",
        description: saveError.message || "Unable to update newsletter draft",
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

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  if (!hasValidId) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Invalid newsletter ID</CardTitle>
            <CardDescription>The edit link is missing or malformed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/newsletters">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Newsletters
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !newsletter) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load newsletter</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Newsletter not found or inaccessible."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/newsletters">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Newsletters
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (newsletter.status !== "draft") {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <p className="text-muted-foreground mb-4">Only draft newsletters can be edited.</p>
        <Button asChild variant="outline">
          <Link href={`/admin/newsletters/${newsletterId}`}>Back to newsletter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-10 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/newsletters/${newsletterId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletter
          </Link>
        </Button>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold leading-tight break-words">Edit Newsletter</h1>
              {getStatusBadge(newsletter.status)}
            </div>
            <p className="text-muted-foreground">
              Created {format(new Date(newsletter.createdAt), "PPp")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <NewsletterPreviewDialog subject={subject} previewText={previewText} contentHtml={content} />
            <Button variant="outline" asChild>
              <Link href={`/admin/newsletters/${newsletterId}`}>Cancel</Link>
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Alert>
          <AlertTitle>Merge tags</AlertTitle>
          <AlertDescription className="text-sm">
            Use {"{{firstName}}"}, {"{{Name}}"}, {"{{company}}"}, {"{{email}}"} in subject or body. Values come from CRM
            when the recipient matches a contact; otherwise the name is derived from the email address.
          </AlertDescription>
        </Alert>

        {newsletter.status !== "draft" && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              This newsletter is no longer a draft. Editing is disabled to preserve sent/scheduled content.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Newsletter Details</CardTitle>
            <CardDescription>Update your subject line and preview text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-1"
                disabled={newsletter.status !== "draft"}
              />
            </div>
            <div>
              <Label htmlFor="preview-text">Preview Text</Label>
              <Input
                id="preview-text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Appears next to your subject line in inboxes"
                className="mt-1"
                disabled={newsletter.status !== "draft"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>
              {newsletter.status === "draft"
                ? "Edit the newsletter body."
                : "Read-only content for non-draft newsletters."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {newsletter.status === "draft" ? (
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your newsletter content..."
              />
            ) : (
              <div
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_blockquote]:text-muted-foreground [&_code]:text-foreground [&_pre]:text-foreground [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
