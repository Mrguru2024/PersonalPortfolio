/**
 * Visual documentation. If you add Storybook, convert to CSF with @storybook/react.
 */
import { ProposalPrepProfitabilityCard } from "./index";

export default {
  title: "CRM/ProposalPrepProfitabilityCard",
  component: ProposalPrepProfitabilityCard,
};

export function Default() {
  return (
    <div className="p-6 bg-muted/30 max-w-2xl">
      <ProposalPrepProfitabilityCard
        initial={{ quotedPrice: 20000, internalHours: 60, hourlyCost: 85, passThroughCosts: 1200, salesCommissionPct: 8 }}
        onSave={() => {}}
        isSaving={false}
      />
    </div>
  );
}
