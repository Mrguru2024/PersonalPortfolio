"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import OfferValuationWorkspace from "@/components/offer-valuation/OfferValuationWorkspace";

export default function AdminOfferValuationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    } else if (!isLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user?.isAdmin || !user?.adminApproved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-6xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Offer Valuation Engine</h1>
          <p className="text-muted-foreground mt-2">
            Admin decision engine for offer quality, positioning, and conversion strategy.
          </p>
        </div>

        <OfferValuationWorkspace mode="admin" />
      </div>
    </div>
  );
}
