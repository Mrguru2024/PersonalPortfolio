import type { ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickCreatePersonaModal } from "./index";
import { apiRequest } from "@/lib/queryClient";

jest.mock("@/lib/queryClient", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

function renderModal(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("QuickCreatePersonaModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title when open", () => {
    renderModal(
      <QuickCreatePersonaModal open onOpenChange={() => {}} />,
    );
    expect(screen.getByRole("dialog", { name: /new marketing persona/i })).toBeInTheDocument();
  });

  it("submits POST with slug and lines when Create is clicked", async () => {
    const user = userEvent.setup();
    const onCreated = jest.fn();

    mockedApiRequest.mockResolvedValue({
      json: async () => ({ persona: { id: "acme-buyer", displayName: "ACME Buyer" } }),
    } as unknown as Response);

    renderModal(
      <QuickCreatePersonaModal open onOpenChange={() => {}} onCreated={onCreated} />,
    );

    await user.type(screen.getByLabelText(/persona id/i), "acme-buyer");
    await user.type(screen.getByLabelText(/^display name/i), "ACME Buyer");
    await user.type(screen.getByLabelText(/problems/i), "Slow site\nNo leads");

    await user.click(screen.getByRole("button", { name: /create & use/i }));

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledWith(
        "POST",
        "/api/admin/ascendra-intelligence/personas",
        expect.objectContaining({
          id: "acme-buyer",
          displayName: "ACME Buyer",
          problems: ["Slow site", "No leads"],
        }),
      );
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: "acme-buyer", displayName: "ACME Buyer" });
    });
  });
});
