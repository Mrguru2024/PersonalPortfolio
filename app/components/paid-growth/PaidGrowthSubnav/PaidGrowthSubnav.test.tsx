import { render, screen } from "@testing-library/react";
import { PaidGrowthSubnav } from "./index";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/paid-growth",
}));

describe("PaidGrowthSubnav", () => {
  it("renders dashboard link", () => {
    render(<PaidGrowthSubnav />);
    expect(screen.getByRole("navigation", { name: "Growth Engine" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/admin/paid-growth");
  });
});
