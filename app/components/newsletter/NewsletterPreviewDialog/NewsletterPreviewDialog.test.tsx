/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterPreviewDialog } from "./index";

describe("NewsletterPreviewDialog", () => {
  it("renders trigger and opens dialog", async () => {
    const user = userEvent.setup();
    render(
      <NewsletterPreviewDialog subject="Hello {{firstName}}" previewText="Preview" contentHtml="<p>Hi</p>" />,
    );
    await user.click(screen.getByRole("button", { name: /preview as recipient/i }));
    expect(await screen.findByRole("heading", { name: /recipient preview/i })).toBeInTheDocument();
    expect(screen.getByText(/Subject:/i)).toBeInTheDocument();
  });
});
