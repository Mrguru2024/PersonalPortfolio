import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { InternalAuditRunDetailClient } from "./InternalAuditRunDetailClient";

export default function InternalAuditRunDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      }
    >
      <InternalAuditRunDetailClient />
    </Suspense>
  );
}
