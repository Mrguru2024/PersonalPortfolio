import { render, screen } from "@testing-library/react";
import { CommunicationsSubnav } from "./index";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/communications",
}));

describe("CommunicationsSubnav", () => {
  it("renders overview and campaigns links", () => {
    render(<CommunicationsSubnav />);
    expect(screen.getByRole("navigation", { name: "Communications sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", "/admin/communications");
    expect(screen.getByRole("link", { name: /Campaigns/i })).toHaveAttribute("href", "/admin/communications/campaigns");
  });
});
