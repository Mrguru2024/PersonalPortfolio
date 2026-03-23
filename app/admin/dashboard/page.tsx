"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AscendraOperationsDashboard from "@/components/admin/operations-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LEGACY_LINKS = [
  { label: "Lead intake hub", href: "/admin/lead-intake" },
  { label: "CRM workspace", href: "/admin/crm" },
  { label: "CRM tasks", href: "/admin/crm/tasks" },
  { label: "Content Studio", href: "/admin/content-studio" },
  { label: "Funnel & offers", href: "/admin/funnel" },
  { label: "Growth OS", href: "/admin/growth-os" },
  { label: "Users", href: "/admin/users" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Site directory", href: "/admin/site-directory" },
  { label: "Reminders", href: "/admin/reminders" },
] as const;

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (!user.isAdmin || !user.adminApproved) {
      router.replace("/");
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  return (
    <div className="min-h-screen w-full min-w-0 max-w-7xl mx-auto px-3 fold:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <AscendraOperationsDashboard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Admin Tools</CardTitle>
          <CardDescription>
            Existing workflows remain available from their dedicated admin routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {LEGACY_LINKS.map((item) => (
            <Button key={item.href} variant="outline" size="sm" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
