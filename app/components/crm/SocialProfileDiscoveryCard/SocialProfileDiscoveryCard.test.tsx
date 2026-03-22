import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocialProfileDiscoveryCard } from "./index";

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SocialProfileDiscoveryCard", () => {
  it("renders discovery heading and manual search links", () => {
    renderWithQuery(
      <SocialProfileDiscoveryCard
        contactId={9}
        contactName="Sam Rivera"
        company="Rivera Co"
        jobTitle="Founder"
        onUpdated={() => {}}
      />
    );

    expect(screen.getByText(/social profile discovery/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discover social profiles/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /web \(duckduckgo\)/i })).toHaveAttribute(
      "href",
      expect.stringContaining("duckduckgo.com")
    );
  });
});
