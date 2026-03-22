import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContactBookingSection } from "./index";

jest.mock("@/lib/useVisitorTracking", () => ({
  useVisitorTracking: () => ({ track: jest.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("ContactBookingSection", () => {
  it("renders hero and form fields", () => {
    renderWithProviders(<ContactBookingSection />);

    expect(
      screen.getByRole("heading", { name: /let's map your next move/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Business name")).toBeInTheDocument();
  });

  it("prefills primary goal when a topic chip is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactBookingSection />);

    await user.click(
      screen.getByRole("button", { name: /brand & messaging/i }),
    );

    const goal = screen.getByLabelText(/primary goal \*/i) as HTMLTextAreaElement;
    expect(goal.value).toContain("brand story");
  });
});
