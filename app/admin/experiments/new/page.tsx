"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { CreateExperimentWizard } from "@/components/aee/CreateExperimentWizard";

export default function AdminExperimentsNewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (
      !authLoading &&
      user &&
      (!user.isAdmin || !user.adminApproved) &&
      user.permissions?.experiments !== true &&
      user.isSuperUser !== true
    ) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const canSee =
    !!user &&
    ((user.isAdmin && user.adminApproved) || user.permissions?.experiments === true || user.isSuperUser === true);

  if (authLoading || !canSee) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="max-w-3xl min-w-0">
        <h2 className="text-lg font-semibold tracking-tight">Create a new test</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Four quick steps: name your idea, pick what you’re changing, set who sees which version, then save a draft. We fill
          in the behind-the-scenes tracking code from your title unless you choose to edit it.
        </p>
      </div>
      <CreateExperimentWizard />
    </div>
  );
}
