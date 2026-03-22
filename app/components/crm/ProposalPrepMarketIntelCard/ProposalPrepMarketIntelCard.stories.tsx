/**
 * Visual documentation. If you add Storybook, convert to CSF with @storybook/react.
 */
import { ProposalPrepMarketIntelCard } from "./index";

export default {
  title: "CRM/ProposalPrepMarketIntelCard",
  component: ProposalPrepMarketIntelCard,
};

export function Empty() {
  return (
    <div className="p-6 bg-muted/30 max-w-2xl">
      <ProposalPrepMarketIntelCard workspaceId="1" summary={null} sources={[]} meta={null} />
    </div>
  );
}
