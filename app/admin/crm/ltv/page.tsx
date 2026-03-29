"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLtvWorkspace from "@/components/AdminLtvWorkspace";

export default function CrmLtvPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-6xl py-8 px-4">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href="/admin/crm/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            CRM overview
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LTV & revenue reports</h1>
            <p className="text-muted-foreground mt-0.5">
              Set filters and optional scenario inputs, run the report on demand, and download CSV.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/crm/discovery-tools">Discovery toolkit</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/crm">Contacts</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/crm/pipeline">Pipeline</Link>
            </Button>
          </div>
        </div>
        <AdminLtvWorkspace />
      </div>
    </div>
  );
}
