import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FooterLanguageControl } from "./FooterLanguageControl";
import { LocaleProvider } from "@/contexts/LocaleContext";

function wrap(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("FooterLanguageControl", () => {
  it("renders language buttons", () => {
    wrap(<FooterLanguageControl />);
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Español" })).toBeInTheDocument();
  });

  it("switches locale when Español is clicked", async () => {
    const user = userEvent.setup();
    wrap(<FooterLanguageControl />);
    await user.click(screen.getByRole("button", { name: "Español" }));
    expect(document.documentElement.lang).toBe("es");
  });
});
