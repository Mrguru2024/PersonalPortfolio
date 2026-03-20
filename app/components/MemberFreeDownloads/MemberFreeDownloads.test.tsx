import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberFreeDownloads } from "./index";
import { useAuth } from "@/hooks/use-auth";

jest.mock("@/hooks/use-auth");

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("MemberFreeDownloads", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("shows sign-in CTA when logged out", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    renderWithQuery(<MemberFreeDownloads />);

    expect(screen.getByRole("heading", { name: /member downloads/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in or register/i })).toHaveAttribute("href", "/auth");
  });

  it("shows loading while auth resolves", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    renderWithQuery(<MemberFreeDownloads />);

    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it("lists offers for signed-in user", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: "u" } as ReturnType<typeof useAuth>["user"],
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        offers: [
          {
            id: 1,
            title: "Startup Kit",
            description: "PDF guide",
            assetType: "pdf",
            mimeType: "application/pdf",
            fileSizeBytes: 1024,
            updatedAt: new Date().toISOString(),
            downloadUrl: "/api/user/free-offers/1/download",
          },
        ],
      }),
    });

    renderWithQuery(<MemberFreeDownloads />);

    await waitFor(() => {
      expect(screen.getByText("Startup Kit")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /download/i })).toHaveAttribute(
      "href",
      "/api/user/free-offers/1/download"
    );
  });

  it("shows empty message when user has no offers", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 1, username: "u" } as ReturnType<typeof useAuth>["user"],
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ offers: [] }),
    });

    renderWithQuery(<MemberFreeDownloads />);

    await waitFor(() => {
      expect(screen.getByText(/no member downloads yet/i)).toBeInTheDocument();
    });
  });
});
