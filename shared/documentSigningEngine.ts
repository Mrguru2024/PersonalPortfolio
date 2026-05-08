export const DOCUMENT_TYPES = [
  "agreement",
  "contract",
  "statement_of_work",
  "amendment",
  "proposal",
  "order_form",
  "master_services",
  "custom",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

const DOCUMENT_TYPE_SET = new Set<string>(DOCUMENT_TYPES);

export const SIGNER_ROLES = ["admin", "client"] as const;
export type SignerRole = (typeof SIGNER_ROLES)[number];

export type SignatureFieldKey =
  | "legalName"
  | "signatureImageBase64"
  | "acceptTerms"
  | "acceptEngagement";

export interface SignatureFieldDefinition {
  key: SignatureFieldKey;
  label: string;
  required: boolean;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  agreement: "Service agreement",
  contract: "Service contract",
  statement_of_work: "Statement of work",
  amendment: "Amendment",
  proposal: "Proposal",
  order_form: "Order form",
  master_services: "Master services agreement",
  custom: "Custom document",
};

/** Short hints for admin UI when picking a document type */
export const DOCUMENT_TYPE_HINTS: Record<DocumentType, string> = {
  agreement: "Standard client engagement summary for signature.",
  contract: "Formal contract framing; same signing flow.",
  statement_of_work: "Scoped deliverables and milestones (SOW).",
  amendment: "Change order or addendum to an existing deal.",
  proposal: "Commercial proposal prior to final signature.",
  order_form: "Order-specific terms tied to a SKU or package.",
  master_services: "Umbrella MSA; detail in child SOWs.",
  custom: "Use a display title you define below.",
};

export const SIGNATURE_FIELDS_BY_ROLE: Record<SignerRole, SignatureFieldDefinition[]> = {
  client: [
    { key: "legalName", label: "Full legal name", required: true },
    { key: "signatureImageBase64", label: "Drawn signature image", required: false },
    { key: "acceptTerms", label: "Accept terms of service", required: true },
    { key: "acceptEngagement", label: "Accept service engagement expectations", required: true },
  ],
  admin: [
    { key: "legalName", label: "Admin legal name", required: true },
    { key: "signatureImageBase64", label: "Admin drawn signature image", required: false },
    { key: "acceptTerms", label: "Confirm terms reviewed", required: true },
    { key: "acceptEngagement", label: "Confirm engagement scope reviewed", required: true },
  ],
};

export function normalizeDocumentType(value: unknown): DocumentType {
  if (typeof value !== "string") return "agreement";
  const v = value.trim().toLowerCase().replace(/-/g, "_");
  if (v === "sow") return "statement_of_work";
  if (DOCUMENT_TYPE_SET.has(v)) return v as DocumentType;
  if (v === "msa") return "master_services";
  return "agreement";
}

export function documentDisplayTitle(documentType: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[documentType];
}

/** Final title for HTML, PDF, and client UI — optional admin override wins. */
export function resolveAgreementDisplayTitle(
  documentType: DocumentType,
  titleOverride?: string | null,
): string {
  const t = typeof titleOverride === "string" ? titleOverride.trim() : "";
  if (t) return t.slice(0, 200);
  return documentDisplayTitle(documentType);
}

export function agreementDisplayTitleFromVariables(
  variablesJson: Record<string, unknown> | null | undefined,
): string {
  const docType = normalizeDocumentType(variablesJson?.documentType);
  const override =
    typeof variablesJson?.documentTitleOverride === "string" ? variablesJson.documentTitleOverride : null;
  return resolveAgreementDisplayTitle(docType, override);
}
