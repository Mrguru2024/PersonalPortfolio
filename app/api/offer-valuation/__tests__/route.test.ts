/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const mockGetSessionUser = jest.fn();
const mockResolveRole = jest.fn();
const mockEnsureCrmLeadFromFormSubmission = jest.fn();
const mockRunOfferValuation = jest.fn();
const mockLogActivity = jest.fn();
const mockBuildPayloadFromContactId = jest.fn();
const mockFireWorkflows = jest.fn();
const mockSendDirectMessageEmail = jest.fn();
const mockSendNotification = jest.fn();

const mockStorage = {
  getOfferValuationSettings: jest.fn(),
  createOfferValuation: jest.fn(),
  listOfferValuations: jest.fn(),
  getOfferValuationById: jest.fn(),
  deleteOfferValuation: jest.fn(),
  getCrmDeals: jest.fn(),
  createCrmDeal: jest.fn(),
  updateCrmContact: jest.fn(),
  getCrmContactsByEmails: jest.fn(),
};

jest.mock("@server/storage", () => ({ storage: mockStorage }));
jest.mock("@/lib/auth-helpers", () => ({
  getSessionUser: (...args: unknown[]) => mockGetSessionUser(...args),
  resolveAscendraAccessFromSessionUser: (...args: unknown[]) =>
    mockResolveRole(...args),
}));
jest.mock("@server/services/leadFromFormService", () => ({
  ensureCrmLeadFromFormSubmission: (...args: unknown[]) =>
    mockEnsureCrmLeadFromFormSubmission(...args),
}));
jest.mock("@server/services/offerValuationService", () => ({
  runOfferValuation: (...args: unknown[]) => mockRunOfferValuation(...args),
}));
jest.mock("@server/services/crmFoundationService", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));
jest.mock("@server/services/workflows/engine", () => ({
  buildPayloadFromContactId: (...args: unknown[]) =>
    mockBuildPayloadFromContactId(...args),
  fireWorkflows: (...args: unknown[]) => mockFireWorkflows(...args),
}));
jest.mock("@server/services/emailService", () => ({
  emailService: {
    sendDirectMessageEmail: (...args: unknown[]) =>
      mockSendDirectMessageEmail(...args),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

function mkReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/offer-valuation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/offer-valuation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getOfferValuationSettings.mockResolvedValue({
      id: 1,
      accessMode: "lead_magnet",
      clientAccessEnabled: true,
      publicAccessEnabled: true,
      paidModeEnabled: false,
      aiDefaultEnabled: false,
      requireLeadCapture: true,
    });
    mockStorage.createOfferValuation.mockResolvedValue({ id: 101 });
    mockStorage.getCrmDeals.mockResolvedValue([]);
    mockStorage.getCrmContactsByEmails.mockResolvedValue([]);
    mockEnsureCrmLeadFromFormSubmission.mockResolvedValue({
      id: 321,
      tags: [],
      customFields: {},
      accountId: null,
    });
    mockBuildPayloadFromContactId.mockResolvedValue({ contactId: 321 });
    mockRunOfferValuation.mockImplementation(
      async ({
        scores,
        aiEnabled,
      }: {
        scores: {
          dreamOutcome: number;
          perceivedLikelihood: number;
          timeDelay: number;
          effortAndSacrifice: number;
        };
        aiEnabled: boolean;
      }) => {
        const raw =
          (scores.dreamOutcome * scores.perceivedLikelihood) /
          (scores.timeDelay * scores.effortAndSacrifice);
        const finalScore = Number(
          Math.min(10, Math.max(0, ((Math.log10(raw) + 2) / 4) * 10)).toFixed(2),
        );
        const scoreBand =
          finalScore < 5 ? "low" : finalScore < 8 ? "mid" : "high";
        const recommendationTier =
          scoreBand === "low"
            ? "correction"
            : scoreBand === "mid"
              ? "optimization"
              : "scaling";
        return {
          inputsUsed: scores,
          rawScore: raw,
          finalScore,
          scoreBand,
          aiUsed: aiEnabled,
          insights: {
            scoreBreakdown: {
              dreamOutcome: { score: scores.dreamOutcome, explanation: "x" },
              perceivedLikelihood: {
                score: scores.perceivedLikelihood,
                explanation: "x",
              },
              timeDelay: { score: scores.timeDelay, explanation: "x" },
              effortAndSacrifice: {
                score: scores.effortAndSacrifice,
                explanation: "x",
              },
            },
            offerDiagnosis: { strengths: ["s"], weaknesses: ["w"] },
            strategicFixes: ["fix"],
            upgradedOffer: aiEnabled ? "AI upgraded offer" : "Rules upgraded offer",
            suggestedBonuses: ["bonus"],
            suggestedGuarantees: ["guarantee"],
            positioningImprovements: ["positioning"],
            monetizationInsight: "insight",
            recommendationTier,
            aiGenerated: aiEnabled,
          },
        };
      },
    );
  });

  it("returns correction/optimization/scaling outputs for low/mid/high scores", async () => {
    mockGetSessionUser.mockResolvedValue({ id: 1, isAdmin: true, adminApproved: true });
    mockResolveRole.mockReturnValue("ADMIN");
    const { POST } = await import("../route");

    const lowRes = await POST(
      mkReq({
        persona: "B2B Founder",
        offerName: "Low offer",
        description: "This is a low confidence offer description for testing output.",
        scores: {
          dreamOutcome: 3,
          perceivedLikelihood: 3,
          timeDelay: 8,
          effortAndSacrifice: 9,
        },
        aiEnabled: false,
      }),
    );
    const lowBody = await lowRes.json();
    expect(lowRes.status).toBe(200);
    expect(lowBody.insights.recommendationTier).toBe("correction");

    const midRes = await POST(
      mkReq({
        persona: "B2B Founder",
        offerName: "Mid offer",
        description: "This is a balanced offer description for optimization test.",
        scores: {
          dreamOutcome: 7,
          perceivedLikelihood: 7,
          timeDelay: 5,
          effortAndSacrifice: 5,
        },
        aiEnabled: false,
      }),
    );
    const midBody = await midRes.json();
    expect(midBody.insights.recommendationTier).toBe("optimization");

    const highRes = await POST(
      mkReq({
        persona: "B2B Founder",
        offerName: "High offer",
        description: "This is a strong and clear offer description for scaling test.",
        scores: {
          dreamOutcome: 10,
          perceivedLikelihood: 10,
          timeDelay: 2,
          effortAndSacrifice: 2,
        },
        aiEnabled: false,
      }),
    );
    const highBody = await highRes.json();
    expect(highBody.insights.recommendationTier).toBe("scaling");
  });

  it("gates public flow then creates CRM lead after contact capture", async () => {
    mockGetSessionUser.mockResolvedValue(null);
    mockResolveRole.mockReturnValue("PUBLIC");
    const { POST } = await import("../route");

    const gated = await POST(
      mkReq({
        persona: "Agency Owner",
        offerName: "Lead magnet offer",
        description: "Public lead magnet valuation content to test contact gating.",
        scores: {
          dreamOutcome: 6,
          perceivedLikelihood: 6,
          timeDelay: 5,
          effortAndSacrifice: 6,
        },
      }),
    );
    const gatedBody = await gated.json();
    expect(gated.status).toBe(200);
    expect(gatedBody.gated).toBe(true);

    const unlocked = await POST(
      mkReq({
        persona: "Agency Owner",
        offerName: "Lead magnet offer",
        description: "Public lead magnet valuation content to test contact gating.",
        scores: {
          dreamOutcome: 6,
          perceivedLikelihood: 6,
          timeDelay: 5,
          effortAndSacrifice: 6,
        },
        leadCapture: {
          name: "Public User",
          email: "public@example.com",
          businessType: "Agency",
        },
      }),
    );
    const unlockedBody = await unlocked.json();
    expect(unlocked.status).toBe(200);
    expect(unlockedBody.ok).toBe(true);
    expect(mockEnsureCrmLeadFromFormSubmission).toHaveBeenCalledTimes(1);
    expect(mockStorage.createCrmDeal).toHaveBeenCalledTimes(1);
    expect(mockStorage.createOfferValuation).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 321 }),
    );
  });

  it("returns different AI outputs when aiEnabled is toggled", async () => {
    mockGetSessionUser.mockResolvedValue({ id: 1, isAdmin: true, adminApproved: true });
    mockResolveRole.mockReturnValue("ADMIN");
    const { POST } = await import("../route");

    const offRes = await POST(
      mkReq({
        persona: "SaaS Operator",
        offerName: "AI off",
        description: "Offer description used to compare ai mode output behavior.",
        scores: {
          dreamOutcome: 8,
          perceivedLikelihood: 6,
          timeDelay: 4,
          effortAndSacrifice: 4,
        },
        aiEnabled: false,
      }),
    );
    const offBody = await offRes.json();

    const onRes = await POST(
      mkReq({
        persona: "SaaS Operator",
        offerName: "AI on",
        description: "Offer description used to compare ai mode output behavior.",
        scores: {
          dreamOutcome: 8,
          perceivedLikelihood: 6,
          timeDelay: 4,
          effortAndSacrifice: 4,
        },
        aiEnabled: true,
      }),
    );
    const onBody = await onRes.json();

    expect(offBody.aiUsed).toBe(false);
    expect(onBody.aiUsed).toBe(true);
    expect(offBody.insights.upgradedOffer).not.toEqual(onBody.insights.upgradedOffer);
  });
});

