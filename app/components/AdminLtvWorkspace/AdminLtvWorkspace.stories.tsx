/**
 * Visual documentation. If you add Storybook, convert to CSF with @storybook/react.
 */
import { AdminLtvWorkspaceView } from "./index";
import type { CrmLtvSnapshot } from "@shared/crmLtvSnapshot";

const sample: CrmLtvSnapshot = {
  wonDealValueCents: 48200_00,
  openPipelineValueCents: 128900_00,
  clientCount: 12,
  clientsWithEstimateCount: 7,
  totalClientEstimatedLtvCents: 340000_00,
  avgClientEstimatedLtvCents: 48571_43,
  leadsWithEstimateCount: 18,
  totalLeadEstimatedValueCents: 210000_00,
  contactsMissingEstimateCount: 42,
  topSourcesByValue: [
    { source: "website", totalCents: 95000_00, contactCount: 5 },
    { source: "referral", totalCents: 62000_00, contactCount: 3 },
  ],
  topContactsByEstimate: [
    { id: 1, name: "Sam Carter", company: "Northwind", type: "client", estimatedValueCents: 85000_00 },
    { id: 2, name: "Jordan Lee", company: null, type: "lead", estimatedValueCents: 42000_00 },
  ],
};

export default {
  title: "Admin/AdminLtvWorkspace",
  component: AdminLtvWorkspaceView,
};

export function Loaded() {
  return (
    <div className="p-6 bg-background max-w-6xl">
      <AdminLtvWorkspaceView snapshot={sample} isLoading={false} />
    </div>
  );
}

export function Loading() {
  return (
    <div className="p-6 bg-background max-w-6xl">
      <AdminLtvWorkspaceView snapshot={undefined} isLoading />
    </div>
  );
}
