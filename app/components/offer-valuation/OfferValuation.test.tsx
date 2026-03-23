import { render, screen, waitFor } from "@testing-library/react";
import OfferValuationTool from "./index";

const mockUseAuth = jest.fn();
const mockTrack = jest.fn();
const mockToast = jest.fn();

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/useVisitorTracking", () => ({
  useVisitorTracking: () => ({
    track: mockTrack,
    getVisitorId: () => "visitor_test_1",
  }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("OfferValuationTool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        accessMode: "internal_tool",
        clientAccessEnabled: true,
        publicAccessEnabled: true,
        paidModeEnabled: false,
        aiDefaultEnabled: false,
        requireLeadCapture: true,
      }),
    } as Response);
  });

  it("shows sign-in prompt for internal anonymous users", async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(<OfferValuationTool surface="internal" />);
    await screen.findByText("Sign in required");
    expect(screen.getByText(/Sign in to continue/i)).toBeInTheDocument();
  });

  it("renders valuation form for authenticated users", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, isAdmin: true, adminApproved: true },
      isLoading: false,
    });
    render(<OfferValuationTool surface="internal" />);
    await waitFor(() =>
      expect(screen.getByText("Evaluate your offer")).toBeInTheDocument(),
    );
    expect(screen.getByText("Run valuation")).toBeInTheDocument();
  });
});

