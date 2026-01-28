"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Send, Edit, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";

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
    } else if (!authLoading && user && !user.isAdmin) {
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

  if (!user || !user.isAdmin || !newsletter) {
    return null;
  }

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
            <p className="text-gray-600 dark:text-gray-400">
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
        {newsletter.previewText && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Text</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{newsletter.previewText}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
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
    </div>
  );
}
