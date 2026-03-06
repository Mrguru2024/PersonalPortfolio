"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminBlog from "@/pages/AdminBlog";
import Link from "next/link";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminBlogPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isApprovedAdmin =
    user.isAdmin === true && user.adminApproved === true;
  const isApprovedDeveloper =
    user.isAdmin !== true &&
    user.role === "developer" &&
    user.adminApproved === true;
  const canCreate = isApprovedAdmin || isApprovedDeveloper;

  if (!canCreate) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </div>
            <CardDescription>
              Contributor access required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Only approved developer contributors and admins can create posts.
              Developer submissions require admin approval before publishing.
            </p>
            {user.isAdmin !== true && (
              <div className="mb-4 rounded-lg border bg-muted/40 p-3">
                <p className="text-sm text-muted-foreground">
                  Want to write here as a developer? Submit a contributor request
                  and an admin will review your account.
                </p>
                <Button
                  className="mt-3"
                  disabled={requestingAccess || requestSubmitted}
                  onClick={async () => {
                    setRequestingAccess(true);
                    try {
                      const res = await fetch("/api/blog/contributor-request", {
                        method: "POST",
                        credentials: "include",
                      });
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(
                          body?.message || "Failed to submit contributor request."
                        );
                      }
                      setRequestSubmitted(true);
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setRequestingAccess(false);
                    }
                  }}
                >
                  {requestSubmitted
                    ? "Request submitted"
                    : requestingAccess
                      ? "Submitting..."
                      : "Request contributor access"}
                </Button>
              </div>
            )}
            <div className="flex gap-4">
              <Button onClick={() => router.push("/")} variant="outline">
                Go Home
              </Button>
              <Button onClick={() => router.push("/blog")}>
                View Blog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {isApprovedAdmin && (
        <div className="container mx-auto px-4 pt-6">
          <Card className="max-w-6xl mx-auto border-primary/30 bg-primary/5">
            <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">
                  Admin mode: you can publish directly and review developer submissions.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/blog/review">Review submissions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <AdminBlog />
    </>
  );
}
