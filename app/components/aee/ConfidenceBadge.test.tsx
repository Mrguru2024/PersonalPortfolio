import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "./ConfidenceBadge";

describe("ConfidenceBadge", () => {
  it("labels high confidence", () => {
    render(<ConfidenceBadge value0to100={80} />);
    expect(screen.getByText(/High confidence/)).toBeInTheDocument();
  });

  it("labels low confidence", () => {
    render(<ConfidenceBadge value0to100={20} />);
    expect(screen.getByText(/Low \/ early/)).toBeInTheDocument();
  });
});
