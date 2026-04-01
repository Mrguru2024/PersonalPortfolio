"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EmailHubTemplateForm } from "../../TemplateForm";
import type { EmailHubTemplateRow } from "@shared/emailHubSchema";

export default function EmailHubEditTemplatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const isSuper = isAuthSuperUser(user);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: row, isLoading, isError, error } = useQuery({
    queryKey: ["/api/admin/email-hub/templates", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/email-hub/templates/${id}`);
      return (await res.json()) as EmailHubTemplateRow;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && Number.isFinite(id),
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-destructive">Invalid template id.</p>;
  }

  if (isLoading || !row) {
    if (isError) {
      return (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load template."}
        </p>
      );
    }
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Edit template</h2>
        <p className="text-sm text-muted-foreground font-mono">ID {row.id}</p>
      </div>
      <EmailHubTemplateForm
        mode="edit"
        isSuper={isSuper}
        initial={{
          id: row.id,
          name: row.name,
          category: row.category,
          subjectTemplate: row.subjectTemplate,
          htmlTemplate: row.htmlTemplate,
          textTemplate: row.textTemplate ?? null,
          accessScope: row.accessScope,
        }}
      />
    </div>
  );
}
