import { render, screen } from "@testing-library/react";
import { AdminAgentReplyText } from "./AdminAgentReplyText";

describe("AdminAgentReplyText", () => {
  it("renders markdown links as anchors to internal paths", () => {
    render(<AdminAgentReplyText text="Go to [Analytics](/admin/analytics) now." />);
    const a = screen.getByRole("link", { name: "Analytics" });
    expect(a).toHaveAttribute("href", "/admin/analytics");
  });

  it("renders https markdown links as external anchors", () => {
    render(
      <AdminAgentReplyText text="See [MDN](https://developer.mozilla.org/en-US/docs/Web) for details." />,
    );
    const a = screen.getByRole("link", { name: "MDN" });
    expect(a).toHaveAttribute("href", "https://developer.mozilla.org/en-US/docs/Web");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders bold segments", () => {
    render(<AdminAgentReplyText text="Use **Bold** here." />);
    expect(screen.getByText("Bold").tagName).toBe("STRONG");
  });

  it("renders markdown headings as styled blocks", () => {
    render(<AdminAgentReplyText text={"## Section title\n\nBody line."} />);
    expect(screen.getByText("Section title")).toBeInTheDocument();
    expect(screen.getByText("Body line.")).toBeInTheDocument();
  });

  it("renders bullet list items", () => {
    render(<AdminAgentReplyText text={"- First item\n- Second item"} />);
    expect(screen.getByText("First item")).toBeInTheDocument();
    expect(screen.getByText("Second item")).toBeInTheDocument();
  });

  it("renders inline code", () => {
    render(<AdminAgentReplyText text="Run `npm test` now." />);
    expect(screen.getByText("npm test")).toBeInTheDocument();
    expect(screen.getByText("npm test").tagName).toBe("CODE");
  });
});
