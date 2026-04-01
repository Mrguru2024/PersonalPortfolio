import { deriveSchedulerQualification } from "./schedulerQualification";

describe("deriveSchedulerQualification", () => {
  it("classifies urgent_help when copy mentions asap", () => {
    const q = deriveSchedulerQualification({
      formAnswers: { notes: "Need help ASAP with production" },
      guestEmail: "a@company.com",
      guestPhone: "+1 555 0100",
      guestCompany: "Acme Inc",
    });
    expect(q.intentClassification).toBe("urgent_help");
    expect(q.leadScoreTier).toBe("high");
  });

  it("flags higher no-show risk with thin contact signals", () => {
    const q = deriveSchedulerQualification({
      formAnswers: {},
      guestEmail: "x@gmail.com",
    });
    expect(["medium", "high"]).toContain(q.noShowRiskTier);
  });
});
