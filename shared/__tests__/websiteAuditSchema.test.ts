import { websiteAuditSchema } from "../websiteAuditSchema";

const validPayload = {
  name: "Jane Doe",
  email: "jane@example.com",
  websiteUrl: "https://example.com",
  businessType: "lead-generation" as const,
  targetAudience: "Small business owners in need of online visibility",
  topChallenges:
    "Organic traffic is flat, mobile performance is poor, and landing pages are not converting well.",
  primaryGoals: ["Increase qualified traffic"],
  primaryConversionActions: ["Contact form submissions"],
  priorityPages: ["/", "/services", "/contact"],
  preferredTimeline: "within-2-weeks" as const,
  preferredContactMethod: "email" as const,
  consent: true,
};

describe("websiteAuditSchema", () => {
  it("accepts a valid audit payload", () => {
    const result = websiteAuditSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects payload with invalid URL", () => {
    const result = websiteAuditSchema.safeParse({
      ...validPayload,
      websiteUrl: "example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload without goals", () => {
    const result = websiteAuditSchema.safeParse({
      ...validPayload,
      primaryGoals: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload without consent", () => {
    const result = websiteAuditSchema.safeParse({
      ...validPayload,
      consent: false,
    });
    expect(result.success).toBe(false);
  });
});
