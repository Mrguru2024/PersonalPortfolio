import { resolveAutomatedContactStatusForTrigger } from "../crmJourneyAutomation";

describe("crmJourneyAutomation", () => {
  it("newsletter email maps new to contacted", () => {
    expect(
      resolveAutomatedContactStatusForTrigger(
        "contact_email_sent",
        "new",
        { journeyEvent: { channel: "email", emailSource: "newsletter" } }
      )
    ).toBe("contacted");
  });

  it("welcome sms only nudges new to contacted", () => {
    expect(
      resolveAutomatedContactStatusForTrigger(
        "contact_sms_sent",
        "contacted",
        { journeyEvent: { channel: "sms", smsVariant: "welcome" } }
      )
    ).toBeNull();
  });

  it("booking sms lifts to at least qualified from contacted", () => {
    expect(
      resolveAutomatedContactStatusForTrigger(
        "contact_sms_sent",
        "contacted",
        { journeyEvent: { channel: "sms", smsVariant: "booking" } }
      )
    ).toBe("qualified");
  });

  it("form completed lifts new toward qualified", () => {
    expect(resolveAutomatedContactStatusForTrigger("form_completed", "new", {})).toBe("qualified");
  });
});
