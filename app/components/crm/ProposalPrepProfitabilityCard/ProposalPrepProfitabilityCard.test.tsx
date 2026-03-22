import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalPrepProfitabilityCard } from "./index";

describe("ProposalPrepProfitabilityCard", () => {
  it("calls onSave with parsed inputs", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<ProposalPrepProfitabilityCard initial={{}} onSave={onSave} isSaving={false} />);
    await user.type(screen.getByLabelText(/Quoted/i), "10000");
    await user.click(screen.getByRole("button", { name: /Save calculator/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        quotedPrice: 10000,
      })
    );
  });
});
