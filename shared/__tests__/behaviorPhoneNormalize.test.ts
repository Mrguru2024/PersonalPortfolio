import { normalizePhoneE164 } from "@server/services/behavior/behaviorPhoneTrackingService";

describe("normalizePhoneE164", () => {
  it("adds US country code for 10 digits", () => {
    expect(normalizePhoneE164("5551234567")).toBe("+15551234567");
  });
  it("normalizes explicit E.164", () => {
    expect(normalizePhoneE164("+1 (555) 123-4567")).toBe("+15551234567");
  });
  it("returns empty for blank", () => {
    expect(normalizePhoneE164("  ")).toBe("");
  });
});
