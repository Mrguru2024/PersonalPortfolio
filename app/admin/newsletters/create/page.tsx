"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function CreateNewsletterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [plainText, setPlainText] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && !user.isAdmin) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const saveMutation = useMutation({
    mutationFn: async (sendNow: boolean) => {
      // Convert HTML to plain text for email clients
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      
      const response = await apiRequest("POST", "/api/admin/newsletters", {
        subject,
        previewText,
        content,
        plainText: textContent,
        status: sendNow ? "draft" : "draft", // Will be updated when sending
      });
      return await response.json();
    },
    onSuccess: (data, sendNow) => {
      toast({
        title: "Success",
        description: sendNow ? "Newsletter created! You can now send it." : "Newsletter saved as draft",
      });
      if (sendNow) {
        router.push(`/admin/newsletters/${data.id}`);
      } else {
        router.push("/admin/newsletters");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save newsletter",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/newsletters">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletters
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mt-4 mb-2">Create Newsletter</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build your email campaign with our rich text editor
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Details</CardTitle>
            <CardDescription>Basic information about your newsletter</CardDescription>
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
              />
            </div>
            <div>
              <Label htmlFor="preview-text">Preview Text</Label>
              <Input
                id="preview-text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Short preview text shown in email clients..."
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This text appears after the subject line in most email clients
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Write your newsletter content using the rich text editor</CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your newsletter content..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/newsletters")}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate(false)}
            disabled={!subject || !content || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
