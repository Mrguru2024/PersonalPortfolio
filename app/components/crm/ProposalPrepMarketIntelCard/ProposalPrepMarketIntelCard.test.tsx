import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProposalPrepMarketIntelCard } from "./index";

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("ProposalPrepMarketIntelCard", () => {
  it("shows empty state without summary", () => {
    renderWithClient(<ProposalPrepMarketIntelCard workspaceId="1" summary={null} sources={[]} meta={null} />);
    expect(screen.getByText(/No analysis yet/i)).toBeInTheDocument();
  });
});
