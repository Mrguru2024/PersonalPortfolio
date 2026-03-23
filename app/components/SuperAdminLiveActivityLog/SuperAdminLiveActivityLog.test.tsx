import type { ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuperAdminLiveActivityLog } from "./index";

const mockUseAuth = jest.fn();

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
  isAuthSuperUser: (u: { isSuperUser?: boolean } | null) => u?.isSuperUser === true,
}));

function wrap(ui: ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("SuperAdminLiveActivityLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it("renders nothing when user is not super admin", () => {
    mockUseAuth.mockReturnValue({ user: { isSuperUser: false } });
    const { container } = wrap(<SuperAdminLiveActivityLog />);
    expect(container.firstChild).toBeNull();
  });

  it("shows toggle and opens panel for super admin", async () => {
    mockUseAuth.mockReturnValue({ user: { isSuperUser: true } });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "v-1",
            kind: "visitor",
            at: new Date().toISOString(),
            title: "page_view · /",
            subtitle: "US · desktop",
            severity: "info",
          },
        ],
        serverTime: Date.now(),
      }),
    });

    wrap(<SuperAdminLiveActivityLog />);
    const openBtn = screen.getByRole("button", { name: /open live activity/i });
    await userEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /live activity log/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/page_view/)).toBeInTheDocument();
    });
  });
});
