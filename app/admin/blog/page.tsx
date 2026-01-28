"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminBlog from "@/pages/AdminBlog";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminBlogPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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

  // Check if user can create blogs (admin or writer)
  const canCreate = (user.isAdmin === true && user.adminApproved === true) || user.role === "writer" || user.role === "admin";

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
              You don't have permission to create blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Only administrators and approved writers can create blog posts. 
              If you believe you should have access, please contact an administrator.
            </p>
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

  return <AdminBlog />;
}
