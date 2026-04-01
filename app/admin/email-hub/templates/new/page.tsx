"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { EmailHubTemplateForm } from "../TemplateForm";

export default function EmailHubNewTemplatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuper = isAuthSuperUser(user);

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
      <div>
        <h2 className="text-lg font-semibold">New Email Hub template</h2>
        <p className="text-sm text-muted-foreground">
          {isSuper ?
            <>
              Saved to <code className="text-xs bg-muted px-1 rounded">email_hub_templates</code> for reuse in Compose
              and automation.
            </>
          : "Saved to your template library for Compose and future automation."}
        </p>
      </div>
      <EmailHubTemplateForm
        mode="create"
        isSuper={isSuper}
        initial={{
          name: "",
          category: "general",
          subjectTemplate: "",
          htmlTemplate: "<p></p>",
          textTemplate: null,
          accessScope: "private",
        }}
      />
    </div>
  );
}
