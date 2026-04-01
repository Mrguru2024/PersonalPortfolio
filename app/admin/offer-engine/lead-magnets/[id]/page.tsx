"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { LeadMagnetTemplateEditPage } from "@/route-modules/offer-engine/LeadMagnetTemplateEditPage";

export default function OfferEngineLeadMagnetDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!Number.isFinite(id) || id < 1) return <p className="p-8 text-destructive">Invalid id.</p>;

  return <LeadMagnetTemplateEditPage id={id} />;
}
