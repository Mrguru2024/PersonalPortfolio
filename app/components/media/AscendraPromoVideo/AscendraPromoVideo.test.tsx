import { render, screen } from "@testing-library/react";
import { AscendraPromoVideo } from "./index";

describe("AscendraPromoVideo", () => {
  it("renders video with accessible label", () => {
    render(<AscendraPromoVideo src="/test.mp4" ariaLabel="Test promo" />);
    expect(screen.getByLabelText("Test promo")).toBeInTheDocument();
  });

  it("exposes sound toggle control when autoplay muted", () => {
    render(<AscendraPromoVideo src="/test.mp4" ariaLabel="Promo" playback="autoplayMuted" />);
    expect(screen.getByRole("button", { name: /turn sound on/i })).toBeInTheDocument();
  });

  it("clickToPlay mode has no sound overlay button", () => {
    render(<AscendraPromoVideo src="/test.mp4" ariaLabel="Tips" playback="clickToPlay" />);
    expect(screen.queryByRole("button", { name: /turn sound on/i })).not.toBeInTheDocument();
  });
});
