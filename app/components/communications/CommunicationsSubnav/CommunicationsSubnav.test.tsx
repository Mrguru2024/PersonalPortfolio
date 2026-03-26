import { render, screen } from "@testing-library/react";
import { CommunicationsSubnav } from "./index";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/communications",
}));

describe("CommunicationsSubnav", () => {
  it("renders dashboard and campaigns links", () => {
    render(<CommunicationsSubnav />);
    expect(screen.getByRole("navigation", { name: "Communications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/admin/communications");
    expect(screen.getByRole("link", { name: /Campaigns/i })).toHaveAttribute("href", "/admin/communications/campaigns");
  });
});
