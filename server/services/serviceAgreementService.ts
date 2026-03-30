import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@server/db";
import { clientServiceAgreementMilestones, clientServiceAgreements } from "@shared/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { buildServiceAgreementHtml, type ServiceAgreementTemplateInput } from "./serviceAgreementGenerator";
import { buildServiceAgreementPdfBuffer } from "./agreementPdfService";
import {
  DEFAULT_AGREEMENT_CLAUSE_SLUGS,
  listActiveClausesOrderedBySlugs,
} from "./legalClauseService";
import { createAndSendEnvelopeWithPdf, isDocuSignConfigured } from "./docusignEnvelopeService";
import {
  documentDisplayTitle,
  normalizeDocumentType,
  SIGNATURE_FIELDS_BY_ROLE,
  type DocumentType,
  type SignerRole,
} from "@shared/documentSigningEngine";
import {
  createDraftInvoice,
  finalizeAndSendInvoice,
  isStripeConfigured,
} from "./stripeInvoiceService";

function providerLegalName(): string {
  return process.env.PROPOSAL_COMPANY_NAME?.trim() || "Ascendra Technologies";
}

function signAuditToken(agreementId: number, legalName: string, isoTime: string): string {
  const secret =
    process.env.SESSION_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    "ascendra-dev-agreement-secret";
  return createHmac("sha256", secret)
    .update(`${agreementId}|${legalName.toLowerCase().trim()}|${isoTime}`)
    .digest("hex");
}

export function newAgreementPublicToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createClientServiceAgreement(input: {
  clientName: string;
  clientEmail: string;
  documentType?: DocumentType;
  companyLegalName?: string | null;
  scopeBullets: string[];
  pricingNarrative: string;
  tierHint?: string | null;
  additionalNotes?: string | null;
  clauseSlugs?: string[] | null;
  milestones: Array<{ label: string; amountCents: number }>;
  createdByUserId?: number | null;
  markSent?: boolean;
}) {
  const effectiveDateIso = new Date().toISOString().slice(0, 10);
  const documentType = normalizeDocumentType(input.documentType);
  const clauseSlugs =
    input.clauseSlugs?.filter((s) => s.trim()).length ?
      input.clauseSlugs!.map((s) => s.trim().toLowerCase())
    : [...DEFAULT_AGREEMENT_CLAUSE_SLUGS];
  const clauseRows = await listActiveClausesOrderedBySlugs(clauseSlugs);
  const libraryClauses = clauseRows.map((r) => ({ title: r.title, bodyHtml: r.bodyHtml }));

  const template: ServiceAgreementTemplateInput = {
    documentTypeLabel: documentDisplayTitle(documentType),
    providerLegalName: providerLegalName(),
    clientLegalName: input.companyLegalName?.trim() || input.clientName.trim(),
    clientContactName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    effectiveDateIso,
    scopeBullets: input.scopeBullets,
    pricingNarrative: input.pricingNarrative.trim() || "See milestones and invoice(s) issued in writing.",
    tierHint: input.tierHint,
    additionalNotes: input.additionalNotes,
    libraryClauses,
  };
  const htmlBody = buildServiceAgreementHtml(template);
  const publicToken = newAgreementPublicToken();

  const [ag] = await db
    .insert(clientServiceAgreements)
    .values({
      publicToken,
      status: input.markSent !== false ? "sent" : "draft",
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail.trim().toLowerCase(),
      companyLegalName: input.companyLegalName?.trim() || null,
      scopeBulletsJson: input.scopeBullets.map((s) => s.trim()).filter(Boolean),
      pricingNarrative: input.pricingNarrative.trim() || null,
      tierHint: input.tierHint?.trim() || null,
      htmlBody,
      clauseSlugsJson: clauseSlugs,
      variablesJson: {
        documentType,
        providerLegalName: template.providerLegalName,
        effectiveDateIso,
      },
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();

  if (!ag) throw new Error("Failed to create agreement");

  let order = 0;
  for (const m of input.milestones) {
    if (!m.label?.trim() || !Number.isFinite(m.amountCents) || m.amountCents <= 0) continue;
    await db.insert(clientServiceAgreementMilestones).values({
      agreementId: ag.id,
      sortOrder: order++,
      label: m.label.trim().slice(0, 500),
      amountCents: Math.round(m.amountCents),
      status: "pending",
    });
  }

  return getClientServiceAgreementById(ag.id);
}

export async function getClientServiceAgreementById(id: number) {
  const [ag] = await db.select().from(clientServiceAgreements).where(eq(clientServiceAgreements.id, id)).limit(1);
  if (!ag) return null;
  const milestones = await db
    .select()
    .from(clientServiceAgreementMilestones)
    .where(eq(clientServiceAgreementMilestones.agreementId, id))
    .orderBy(asc(clientServiceAgreementMilestones.sortOrder));
  return { agreement: ag, milestones };
}

export async function getClientServiceAgreementByToken(publicToken: string) {
  const [ag] = await db
    .select()
    .from(clientServiceAgreements)
    .where(eq(clientServiceAgreements.publicToken, publicToken.trim()))
    .limit(1);
  if (!ag) return null;
  const milestones = await db
    .select()
    .from(clientServiceAgreementMilestones)
    .where(eq(clientServiceAgreementMilestones.agreementId, ag.id))
    .orderBy(asc(clientServiceAgreementMilestones.sortOrder));
  return { agreement: ag, milestones };
}

export async function listClientServiceAgreementsForAdmin(limit = 80) {
  return db
    .select()
    .from(clientServiceAgreements)
    .orderBy(desc(clientServiceAgreements.createdAt))
    .limit(Math.min(200, limit));
}

export async function listClientServiceAgreementsEnrichedForAdmin(limit = 80) {
  const rows = await listClientServiceAgreementsForAdmin(limit);
  const out: Awaited<ReturnType<typeof getClientServiceAgreementById>>[] = [];
  for (const r of rows) {
    const bundle = await getClientServiceAgreementById(r.id);
    if (bundle) out.push(bundle);
  }
  return out;
}

export async function signClientServiceAgreement(
  publicToken: string,
  input: {
    signerRole?: SignerRole;
    legalName: string;
    acceptTerms: boolean;
    acceptEngagement: boolean;
    signatureImageBase64?: string | null;
    requestIp?: string | null;
    userAgent?: string | null;
  },
) {
  const row = await getClientServiceAgreementByToken(publicToken);
  if (!row) return { ok: false as const, error: "not_found" };
  const { agreement } = row;
  const signerRole = input.signerRole === "admin" ? "admin" : "client";
  if (agreement.status === "signed" && signerRole === "client") return { ok: false as const, error: "already_signed" };
  if (agreement.status === "cancelled") return { ok: false as const, error: "cancelled" };
  const name = input.legalName.trim();
  if (name.length < 3) return { ok: false as const, error: "invalid_name" };
  const requiredFields = SIGNATURE_FIELDS_BY_ROLE[signerRole].filter((field) => field.required);
  if (
    requiredFields.some((field) => {
      if (field.key === "legalName") return !name;
      if (field.key === "acceptTerms") return !input.acceptTerms;
      if (field.key === "acceptEngagement") return !input.acceptEngagement;
      return false;
    })
  ) {
    return { ok: false as const, error: "consent_required" };
  }

  const signedAt = new Date();
  const auditDigest = signAuditToken(agreement.id, name, signedAt.toISOString());
  const auditEntry = {
    signerRole,
    signedAt: signedAt.toISOString(),
    legalName: name,
    ip: input.requestIp ?? null,
    userAgent: input.userAgent ?? null,
    termsPath: "/terms",
    engagementPath: "/service-engagement",
    auditDigest,
    signatureImageProvided: Boolean(input.signatureImageBase64?.trim()),
  };
  const priorAudit = agreement.signatureAuditJson ?? {};
  const mergedAudit =
    priorAudit && typeof priorAudit === "object" ?
      {
        ...(priorAudit as Record<string, unknown>),
        [signerRole]: auditEntry,
      }
    : { [signerRole]: auditEntry };

  await db
    .update(clientServiceAgreements)
    .set({
      status: signerRole === "client" ? "signed" : agreement.status,
      signedAt: signerRole === "client" ? signedAt : agreement.signedAt,
      signerLegalName: signerRole === "client" ? name : agreement.signerLegalName,
      signatureImageBase64: input.signatureImageBase64?.trim().slice(0, 500_000) || null,
      signatureAuditJson: mergedAudit,
      updatedAt: new Date(),
    })
    .where(eq(clientServiceAgreements.id, agreement.id));

  return { ok: true as const, auditDigest };
}

export function getAgreementDocumentType(agreement: {
  variablesJson: Record<string, unknown> | null;
}): DocumentType {
  const raw = agreement.variablesJson?.documentType;
  return normalizeDocumentType(raw);
}

export async function adminSignAgreementById(
  agreementId: number,
  input: {
    legalName: string;
    acceptTerms: boolean;
    acceptEngagement: boolean;
    signatureImageBase64?: string | null;
    requestIp?: string | null;
    userAgent?: string | null;
  },
) {
  const bundle = await getClientServiceAgreementById(agreementId);
  if (!bundle) return { ok: false as const, error: "agreement_not_found" };
  return signClientServiceAgreement(bundle.agreement.publicToken, {
    signerRole: "admin",
    legalName: input.legalName,
    acceptTerms: input.acceptTerms,
    acceptEngagement: input.acceptEngagement,
    signatureImageBase64: input.signatureImageBase64,
    requestIp: input.requestIp,
    userAgent: input.userAgent,
  });
}

export async function createStripeInvoiceForMilestone(agreementId: number, milestoneId: number) {
  if (!isStripeConfigured()) {
    return { ok: false as const, error: "stripe_not_configured" };
  }
  const bundle = await getClientServiceAgreementById(agreementId);
  if (!bundle) return { ok: false as const, error: "agreement_not_found" };
  const m = bundle.milestones.find((x) => x.id === milestoneId);
  if (!m) return { ok: false as const, error: "milestone_not_found" };
  if (m.status === "paid") return { ok: false as const, error: "already_paid" };
  if (m.stripeInvoiceId) return { ok: false as const, error: "invoice_exists" };

  const { agreement } = bundle;
  const draft = await createDraftInvoice({
    customerEmail: agreement.clientEmail,
    customerName: agreement.clientName,
    title: `Milestone: ${m.label.slice(0, 120)}`,
    lineItems: [{ description: m.label, amount: m.amountCents, quantity: 1, saleType: "service" }],
    metadata: { serviceAgreementMilestoneId: String(m.id) },
  });
  const { hostInvoiceUrl } = await finalizeAndSendInvoice(draft.stripeInvoiceId);
  await db
    .update(clientServiceAgreementMilestones)
    .set({ stripeInvoiceId: draft.stripeInvoiceId, status: "sent" })
    .where(and(eq(clientServiceAgreementMilestones.id, m.id), eq(clientServiceAgreementMilestones.agreementId, agreementId)));

  return { ok: true as const, stripeInvoiceId: draft.stripeInvoiceId, hostInvoiceUrl };
}

export async function findMilestoneByStripeInvoiceId(stripeInvoiceId: string) {
  const [row] = await db
    .select()
    .from(clientServiceAgreementMilestones)
    .where(eq(clientServiceAgreementMilestones.stripeInvoiceId, stripeInvoiceId))
    .limit(1);
  return row ?? null;
}

export async function markMilestonePaidByStripeInvoiceId(stripeInvoiceId: string) {
  const m = await findMilestoneByStripeInvoiceId(stripeInvoiceId);
  if (!m || m.status === "paid") return false;
  await db
    .update(clientServiceAgreementMilestones)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(clientServiceAgreementMilestones.id, m.id));
  return true;
}

/** Optional: verify audit digest (admin support tooling). */
export function verifyAgreementAuditDigest(
  agreementId: number,
  legalName: string,
  signedAtIso: string,
  digest: string,
): boolean {
  const expect = signAuditToken(agreementId, legalName, signedAtIso);
  try {
    return timingSafeEqual(Buffer.from(expect, "hex"), Buffer.from(digest, "hex"));
  } catch {
    return false;
  }
}

export async function touchAgreementPdfGeneratedAt(agreementId: number) {
  await db
    .update(clientServiceAgreements)
    .set({ pdfGeneratedAt: new Date(), updatedAt: new Date() })
    .where(eq(clientServiceAgreements.id, agreementId));
}

export async function buildAgreementPdfBufferForAgreementId(agreementId: number): Promise<Uint8Array | null> {
  const bundle = await getClientServiceAgreementById(agreementId);
  if (!bundle) return null;
  const slugs = bundle.agreement.clauseSlugsJson ?? [...DEFAULT_AGREEMENT_CLAUSE_SLUGS];
  const clauseRows = await listActiveClausesOrderedBySlugs(slugs);
  return buildServiceAgreementPdfBuffer({
    agreement: bundle.agreement,
    milestones: bundle.milestones,
    libraryClauses: clauseRows,
  });
}

export async function sendAgreementViaDocuSign(agreementId: number): Promise<
  | { ok: true; envelopeId: string }
  | { ok: false; error: string }
> {
  if (!isDocuSignConfigured()) return { ok: false, error: "docusign_not_configured" };
  const bundle = await getClientServiceAgreementById(agreementId);
  if (!bundle) return { ok: false, error: "agreement_not_found" };
  if (bundle.agreement.docusignEnvelopeId) return { ok: false, error: "envelope_exists" };

  const pdf = await buildAgreementPdfBufferForAgreementId(agreementId);
  if (!pdf) return { ok: false, error: "pdf_failed" };

  try {
    const created = await createAndSendEnvelopeWithPdf({
      pdfBuffer: pdf,
      documentName: `Ascendra-Agreement-${agreementId}.pdf`,
      emailSubject: "Please sign your service agreement",
      signerEmail: bundle.agreement.clientEmail,
      signerName: bundle.agreement.clientName,
      agreementId,
    });
    await db
      .update(clientServiceAgreements)
      .set({
        docusignEnvelopeId: created.envelopeId,
        docusignStatus: created.status,
        pdfGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientServiceAgreements.id, agreementId));
    return { ok: true, envelopeId: created.envelopeId };
  } catch (e) {
    console.error("[docusign] sendAgreementViaDocuSign", e);
    return { ok: false, error: e instanceof Error ? e.message : "docusign_error" };
  }
}

export async function applyDocuSignEnvelopeStatus(envelopeId: string, statusRaw: string): Promise<boolean> {
  const status = statusRaw.trim().toLowerCase();
  const [ag] = await db
    .select()
    .from(clientServiceAgreements)
    .where(eq(clientServiceAgreements.docusignEnvelopeId, envelopeId.trim()))
    .limit(1);
  if (!ag) return false;

  const completed = status === "completed";
  await db
    .update(clientServiceAgreements)
    .set({
      docusignStatus: statusRaw,
      ...(completed ?
        {
          status: "signed",
          signedAt: ag.signedAt ?? new Date(),
          signerLegalName: ag.signerLegalName ?? "DocuSign signatory",
        }
      : {}),
      updatedAt: new Date(),
    })
    .where(eq(clientServiceAgreements.id, ag.id));
  return true;
}
