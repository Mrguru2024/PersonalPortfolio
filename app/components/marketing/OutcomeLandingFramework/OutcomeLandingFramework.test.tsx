import { render, screen } from "@testing-library/react";
import { OutcomeLandingFramework } from "./index";
import { OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING } from "@/lib/landingPageOutcomeFramework";

describe("OutcomeLandingFramework", () => {
  it("renders section headings from copy preset", () => {
    render(<OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING} />);
    expect(screen.getByRole("region", { name: /outcomes/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING.perceivedOutcomes.heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING.realValue.heading }),
    ).toBeInTheDocument();
  });

  it("renders child CTA slot when provided", () => {
    render(
      <OutcomeLandingFramework copy={OUTCOME_FRAMEWORK_COPY_GROWTH_LANDING}>
        <button type="button">Next step</button>
      </OutcomeLandingFramework>,
    );
    expect(screen.getByRole("button", { name: "Next step" })).toBeInTheDocument();
  });
});
