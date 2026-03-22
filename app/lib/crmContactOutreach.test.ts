import { dialStringFromPhone, mailtoLeadHref, smsHref, telHref } from "./crmContactOutreach";

describe("crmContactOutreach", () => {
  it("builds mailto for valid email", () => {
    expect(mailtoLeadHref("  a@b.co  ")).toBe("mailto:a@b.co");
  });

  it("returns null for empty mailto", () => {
    expect(mailtoLeadHref("  ")).toBeNull();
  });

  it("normalizes US-style phone for tel and sms", () => {
    expect(dialStringFromPhone("(555) 123-4567")).toBe("5551234567");
    expect(telHref("(555) 123-4567")).toBe("tel:5551234567");
    expect(smsHref("(555) 123-4567")).toBe("sms:5551234567");
  });

  it("preserves leading + for international", () => {
    expect(dialStringFromPhone("+44 20 7123 4567")).toBe("+442071234567");
    expect(telHref("+44 20 7123 4567")).toBe("tel:+442071234567");
  });
});
