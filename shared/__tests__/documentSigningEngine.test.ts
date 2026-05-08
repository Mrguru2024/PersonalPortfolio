import {
  agreementDisplayTitleFromVariables,
  normalizeDocumentType,
  resolveAgreementDisplayTitle,
} from "../documentSigningEngine";

describe("documentSigningEngine", () => {
  test("normalizeDocumentType maps aliases and defaults", () => {
    expect(normalizeDocumentType("contract")).toBe("contract");
    expect(normalizeDocumentType("statement_of_work")).toBe("statement_of_work");
    expect(normalizeDocumentType("sow")).toBe("statement_of_work");
    expect(normalizeDocumentType("msa")).toBe("master_services");
    expect(normalizeDocumentType("unknown")).toBe("agreement");
    expect(normalizeDocumentType(null)).toBe("agreement");
  });

  test("resolveAgreementDisplayTitle prefers override", () => {
    expect(resolveAgreementDisplayTitle("agreement", "  Partner SOW  ")).toBe("Partner SOW");
    expect(resolveAgreementDisplayTitle("proposal", null)).toBe("Proposal");
  });

  test("agreementDisplayTitleFromVariables reads json", () => {
    expect(
      agreementDisplayTitleFromVariables({
        documentType: "proposal",
        documentTitleOverride: "Q1 build",
      }),
    ).toBe("Q1 build");
    expect(agreementDisplayTitleFromVariables({ documentType: "order_form" })).toBe("Order form");
  });
});
