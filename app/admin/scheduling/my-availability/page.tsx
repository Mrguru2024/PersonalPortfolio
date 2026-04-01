"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HostAvailabilitySettings } from "@/components/scheduling/HostAvailabilitySettings";

export default function AdminSchedulingMyAvailabilityPage() {
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
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/scheduling">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Scheduling
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">My booking availability</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Control when you accept public bookings. Each approved admin / founder has their own calendar; guests pick a
          host when more than one person is available.
        </p>
      </div>
      <HostAvailabilitySettings />
    </div>
  );
}
