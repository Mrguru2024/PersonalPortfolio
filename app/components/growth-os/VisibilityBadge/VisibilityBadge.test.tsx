/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { VisibilityBadge } from "./index";

describe("VisibilityBadge", () => {
  it("renders internal_only label", () => {
    render(<VisibilityBadge tier="internal_only" />);
    expect(screen.getByText("Internal only")).not.toBeNull();
  });

  it("renders unknown tier as raw key", () => {
    render(<VisibilityBadge tier="custom" />);
    expect(screen.getByText("custom")).not.toBeNull();
  });
});
