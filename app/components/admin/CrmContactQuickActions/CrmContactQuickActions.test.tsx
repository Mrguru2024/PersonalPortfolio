import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CrmContactQuickActions } from "./index";

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CrmContactQuickActions", () => {
  it("opens menu and exposes email link with mailto", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <CrmContactQuickActions
        contact={{
          id: 42,
          name: "Pat Lee",
          email: "pat@example.com",
          phone: "5551234567",
          intentLevel: null,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /quick actions for pat lee/i }));

    const emailItem = screen.getByRole("menuitem", { name: /^email$/i });
    const anchor = emailItem.closest("a");
    expect(anchor).toHaveAttribute("href", "mailto:pat@example.com");
  });
});
