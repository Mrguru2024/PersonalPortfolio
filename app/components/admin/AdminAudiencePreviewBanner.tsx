"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isAuthApprovedAdmin } from "@/lib/super-admin";
import { useAdminAudienceView, type AdminAudienceViewMode } from "@/contexts/AdminAudienceViewContext";

function modeLabel(mode: AdminAudienceViewMode): string {
  if (mode === "customer") return "customer (website + client portal entry)";
  if (mode === "community") return "community member (AFN menus)";
  return "admin";
}

/**
 * Sticky strip under the main header when an approved admin previews the site as customer or AFN member.
 */
export function AdminAudiencePreviewBanner() {
  const { user } = useAuth();
  const { mode, setMode, ready } = useAdminAudienceView();

  if (!ready || !user || !isAuthApprovedAdmin(user) || mode === "admin") {
    return null;
  }

  return (
    <div
      className="w-full border-b border-amber-500/40 bg-amber-500/15 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto flex min-w-0 flex-wrap items-center justify-center gap-2 px-3 py-2 fold:px-4 sm:px-6 sm:justify-between">
        <p className="flex min-w-0 items-center gap-2 text-center text-xs sm:text-sm sm:text-left">
          <Eye className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <span>
            <strong className="font-semibold">Preview:</strong> viewing as {modeLabel(mode)}. Ascendra OS navigation and
            admin tools on the public site are hidden. Your permissions are unchanged — admin APIs still apply your account.
          </span>
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 border-amber-700/40 bg-background/80 dark:border-amber-400/40" asChild>
            <Link href="/admin/settings">Preview settings</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-amber-700 text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
            onClick={() => setMode("admin")}
          >
            Exit preview
          </Button>
        </div>
      </div>
    </div>
  );
}
