import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FooterLanguageControl } from "./FooterLanguageControl";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from "@/lib/i18n/constants";

function wrap(ui: ReactElement) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

describe("FooterLanguageControl", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE}=;path=/;max-age=0`;
    try {
      localStorage.removeItem(LOCALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  });

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
