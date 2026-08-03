/**
 * @jest-environment node
 */

const updateCalls: Array<Record<string, unknown>> = [];
const agreementQueue: any[] = [];

jest.mock("@server/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(async () => {
            const next = agreementQueue.shift();
            return next?.agreement ? [next.agreement] : [];
          }),
          orderBy: jest.fn(async () => []),
        })),
      })),
    })),
    update: jest.fn(() => ({
      set: (payload: Record<string, unknown>) => {
        updateCalls.push(payload);
        return { where: jest.fn(async () => undefined) };
      },
    })),
  },
}));

describe("serviceAgreementService signing workflow", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    agreementQueue.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    agreementQueue.length = 0;
  });

  it("records admin and client signatures independently and marks signed only after both sign", async () => {
    const service = await import("../serviceAgreementService");

    agreementQueue.push(
      {
        agreement: {
          id: 11,
          publicToken: "tok_123",
          status: "sent",
          signedAt: null,
          signerLegalName: null,
          signatureImageBase64: null,
          signatureAuditJson: null,
        },
        milestones: [],
      },
      {
        agreement: {
          id: 11,
          publicToken: "tok_123",
          status: "sent",
          signedAt: null,
          signerLegalName: null,
          signatureImageBase64: null,
          signatureAuditJson: {
            admin: { legalName: "Admin Signer" },
          },
        },
        milestones: [],
      },
    );

    const adminResult = await service.signClientServiceAgreement("tok_123", {
      signerRole: "admin",
      legalName: "Admin Signer",
      acceptTerms: true,
      acceptEngagement: true,
      signatureImageBase64: "data:image/png;base64,AAA",
      requestIp: "127.0.0.1",
      userAgent: "jest",
    });
    expect(adminResult.ok).toBe(true);
    expect(updateCalls[0]?.status).toBe("sent");
    expect((updateCalls[0]?.signatureAuditJson as Record<string, unknown>)?.admin).toBeDefined();
    expect((updateCalls[0]?.signatureAuditJson as Record<string, unknown>)?.client).toBeUndefined();

    const clientResult = await service.signClientServiceAgreement("tok_123", {
      signerRole: "client",
      legalName: "Client Signer",
      acceptTerms: true,
      acceptEngagement: true,
      signatureImageBase64: "data:image/png;base64,BBB",
      requestIp: "127.0.0.1",
      userAgent: "jest",
    });
    expect(clientResult.ok).toBe(true);
    expect(updateCalls[1]?.status).toBe("signed");
    expect(updateCalls[1]?.signerLegalName).toBe("Client Signer");
    expect((updateCalls[1]?.signatureAuditJson as Record<string, unknown>)?.admin).toBeDefined();
    expect((updateCalls[1]?.signatureAuditJson as Record<string, unknown>)?.client).toBeDefined();
  });

  it("rejects duplicate signatures by same role", async () => {
    const service = await import("../serviceAgreementService");
    agreementQueue.push({
      agreement: {
        id: 22,
        publicToken: "tok_dup",
        status: "sent",
        signedAt: null,
        signerLegalName: null,
        signatureImageBase64: null,
        signatureAuditJson: {
          admin: { legalName: "Existing Admin" },
        },
      },
      milestones: [],
    });

    const result = await service.signClientServiceAgreement("tok_dup", {
      signerRole: "admin",
      legalName: "Another Admin",
      acceptTerms: true,
      acceptEngagement: true,
      signatureImageBase64: null,
      requestIp: "127.0.0.1",
      userAgent: "jest",
    });

    expect(result).toEqual({ ok: false, error: "already_signed" });
    expect(updateCalls).toHaveLength(0);
  });
});
