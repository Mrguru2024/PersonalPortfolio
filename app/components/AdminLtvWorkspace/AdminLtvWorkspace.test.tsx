import { render, screen } from "@testing-library/react";
import { AdminLtvWorkspaceView, formatLtvUsd } from "./index";
import type { CrmLtvSnapshot } from "@shared/crmLtvSnapshot";

const mockSnapshot: CrmLtvSnapshot = {
  wonDealValueCents: 100000 * 100,
  openPipelineValueCents: 250000 * 100,
  clientCount: 4,
  clientsWithEstimateCount: 2,
  totalClientEstimatedLtvCents: 80000 * 100,
  avgClientEstimatedLtvCents: 40000 * 100,
  leadsWithEstimateCount: 3,
  totalLeadEstimatedValueCents: 120000 * 100,
  contactsMissingEstimateCount: 5,
  topSourcesByValue: [{ source: "referral", totalCents: 50000 * 100, contactCount: 2 }],
  topContactsByEstimate: [
    { id: 9, name: "Alex Row", company: "Acme", type: "lead", estimatedValueCents: 90000 * 100 },
  ],
};

describe("formatLtvUsd", () => {
  it("formats cents as USD without decimals by default", () => {
    expect(formatLtvUsd(99_50)).toBe("$100");
    expect(formatLtvUsd(100_00)).toBe("$100");
  });
});

describe("AdminLtvWorkspaceView", () => {
  it("renders key metrics from snapshot", () => {
    render(<AdminLtvWorkspaceView snapshot={mockSnapshot} isLoading={false} />);
    expect(screen.getByText("Won deals (board)")).toBeInTheDocument();
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<AdminLtvWorkspaceView snapshot={undefined} isLoading />);
    expect(screen.getByTestId("ltv-loading")).toBeInTheDocument();
  });

  it("links top contacts to CRM profiles", () => {
    render(<AdminLtvWorkspaceView snapshot={mockSnapshot} isLoading={false} contactBasePath="/admin/crm" />);
    const link = screen.getByRole("link", { name: "Alex Row" });
    expect(link).toHaveAttribute("href", "/admin/crm/9");
  });

  it("renders workflow shortcuts", () => {
    render(<AdminLtvWorkspaceView snapshot={mockSnapshot} isLoading={false} />);
    const hrefs = screen.getAllByRole("link").map((el) => el.getAttribute("href"));
    expect(hrefs).toContain("/admin/crm");
    expect(hrefs).toContain("/admin/crm/pipeline");
    expect(hrefs).toContain("/admin/crm/proposal-prep");
  });
});
