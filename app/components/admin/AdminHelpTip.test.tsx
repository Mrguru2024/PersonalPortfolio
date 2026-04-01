import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminHelpTip, AdminTipLabel } from "./AdminHelpTip";

describe("AdminHelpTip", () => {
  it("renders help trigger with accessible name", () => {
    render(
      <TooltipProvider>
        <AdminHelpTip content="Test tip body" ariaLabel="Custom help" />
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: "Custom help" })).toBeInTheDocument();
  });
});

describe("AdminTipLabel", () => {
  it("associates label with field and renders tip", () => {
    render(
      <TooltipProvider>
        <AdminTipLabel htmlFor="x" tip="Tip text">
          Field
        </AdminTipLabel>
      </TooltipProvider>,
    );
    expect(screen.getByText("Field")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Field help" })).toBeInTheDocument();
  });
});
