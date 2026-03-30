"use client";

import { Loader2 } from "lucide-react";
import { CommunityShell } from "./CommunityShell";

/**
 * Stable SSR + first client paint for auth-gated AFN routes. Avoids hydration mismatch when
 * `useAuth` placeholderData (sessionStorage) differs from the server.
 */
export function CommunityAuthLoading() {
  return (
    <CommunityShell>
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    </CommunityShell>
  );
}
