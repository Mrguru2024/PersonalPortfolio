"use client";

import { GuaranteeControlPanel } from "@/components/admin/operations-dashboard/GuaranteeControlPanel";

export default function GrowthOsGuaranteesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Client growth guarantees</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Ascendra Guarantee Engine: monitor portal clients against lead flow, bookings, conversion lift, and payback
          assumptions; trigger CRM follow-ups; run the sales preview calculator. Data ties to CRM, scheduling, quotes,
          and invoices — same model as the client-facing growth guarantee on the site and dashboard.
        </p>
      </div>
      <GuaranteeControlPanel />
    </div>
  );
}
