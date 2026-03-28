"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewsletterPreviewDialog } from "@/components/newsletter/NewsletterPreviewDialog";

export default function EditNewsletterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const qc = useQueryClient();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("<p></p>");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: newsletter, isLoading } = useQuery({
    queryKey: ["/api/admin/newsletters", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/newsletters/${id}`);
      return res.json() as Promise<{
        id: number;
        subject: string;
        previewText?: string | null;
        content: string;
        status: string;
      }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && Number.isFinite(id),
  });

  useEffect(() => {
    if (!newsletter) return;
    setSubject(newsletter.subject);
    setPreviewText(newsletter.previewText ?? "");
    setContent(newsletter.content || "<p></p>");
  }, [newsletter]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const temp = document.createElement("div");
      temp.innerHTML = content;
      const plain = temp.textContent || temp.innerText || "";
      const res = await apiRequest("PATCH", `/api/admin/newsletters/${id}`, {
        subject,
        previewText: previewText || null,
        content,
        plainText: plain,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/newsletters", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
      toast({ title: "Newsletter saved" });
      router.push(`/admin/newsletters/${id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved || !newsletter) {
    return null;
  }

  if (newsletter.status !== "draft") {
    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <p className="text-muted-foreground mb-4">Only draft newsletters can be edited.</p>
        <Button asChild variant="outline">
          <Link href={`/admin/newsletters/${id}`}>Back to newsletter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-10 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/admin/newsletters/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-2">Edit newsletter</h1>
      <p className="text-muted-foreground mb-6">Update subject, preview, and body. Recipients and send stay on the next screen.</p>

      <Alert className="mb-6">
        <AlertTitle>Merge tags</AlertTitle>
        <AlertDescription className="text-sm">
          Use {"{{firstName}}"}, {"{{Name}}"}, {"{{company}}"}, {"{{email}}"} in subject or body. Values come from CRM when the
          recipient matches a contact; otherwise the name is derived from the email address.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Subject, inbox preview line, and HTML body</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <NewsletterPreviewDialog subject={subject} previewText={previewText} contentHtml={content} />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="preview">Preview text</Label>
            <Input id="preview" value={previewText} onChange={(e) => setPreviewText(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Body</Label>
            <div className="mt-1">
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !subject.trim()}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
