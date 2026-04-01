export const DOCUMENT_TYPES = ["agreement", "contract"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

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
  return value === "contract" ? "contract" : "agreement";
}

export function documentDisplayTitle(documentType: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[documentType];
}
