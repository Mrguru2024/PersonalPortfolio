import { render, screen } from "@testing-library/react";
import { AdminAgentReplyText } from "./AdminAgentReplyText";

describe("AdminAgentReplyText", () => {
  it("renders markdown links as anchors to internal paths", () => {
    render(<AdminAgentReplyText text="Go to [Analytics](/admin/analytics) now." />);
    const a = screen.getByRole("link", { name: "Analytics" });
    expect(a).toHaveAttribute("href", "/admin/analytics");
  });

  it("renders bold segments", () => {
    render(<AdminAgentReplyText text="Use **Bold** here." />);
    expect(screen.getByText("Bold").tagName).toBe("STRONG");
  });
});
