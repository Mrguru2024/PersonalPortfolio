/**
 * DocuSign eSignature — JWT grant. Requires env: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID,
 * DOCUSIGN_ACCOUNT_ID, DOCUSIGN_RSA_PRIVATE_KEY (PEM with \\n newlines) or DOCUSIGN_RSA_PRIVATE_KEY_BASE64,
 * DOCUSIGN_BASE_PATH (e.g. https://demo.docusign.net/restapi).
 *
 * First-time JWT: user may need to grant consent via DocuSign admin URL (see DocuSign JWT docs).
 */
import { createRequire } from "module";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docusign = require("docusign-esign") as any;

function getPrivateKey(): Buffer {
  const b64 = process.env.DOCUSIGN_RSA_PRIVATE_KEY_BASE64?.trim();
  if (b64) return Buffer.from(b64, "base64");
  const pem = process.env.DOCUSIGN_RSA_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  if (!pem) throw new Error("DOCUSIGN_RSA_PRIVATE_KEY or DOCUSIGN_RSA_PRIVATE_KEY_BASE64 is required");
  return Buffer.from(pem);
}

export function isDocuSignConfigured(): boolean {
  return Boolean(
    process.env.DOCUSIGN_INTEGRATION_KEY?.trim() &&
      process.env.DOCUSIGN_USER_ID?.trim() &&
      process.env.DOCUSIGN_ACCOUNT_ID?.trim() &&
      (process.env.DOCUSIGN_RSA_PRIVATE_KEY?.trim() || process.env.DOCUSIGN_RSA_PRIVATE_KEY_BASE64?.trim()) &&
      process.env.DOCUSIGN_BASE_PATH?.trim(),
  );
}

function promisifyJwt(apiClient: InstanceType<typeof docusign.ApiClient>): Promise<{ body: { access_token: string } }> {
  return new Promise((resolve, reject) => {
    apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY,
      process.env.DOCUSIGN_USER_ID,
      ["signature", "impersonation"],
      getPrivateKey(),
      3600,
      (err: Error | null, res: { body: { access_token: string } }) => {
        if (err) reject(err);
        else resolve(res);
      },
    );
  });
}

/** Create and send envelope with one PDF document and one signer (email delivery). */
export async function createAndSendEnvelopeWithPdf(opts: {
  pdfBuffer: Uint8Array;
  documentName: string;
  emailSubject: string;
  signerEmail: string;
  signerName: string;
  /** Optional custom field for webhook / correlation */
  agreementId?: number;
}): Promise<{ envelopeId: string; status: string }> {
  if (!isDocuSignConfigured()) throw new Error("DocuSign is not configured");

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH!.trim());

  const tokenRes = await promisifyJwt(apiClient);
  apiClient.addDefaultHeader("Authorization", `Bearer ${tokenRes.body.access_token}`);

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID!.trim();
  const base64 = Buffer.from(opts.pdfBuffer).toString("base64");

  const envelopeDefinition = {
    emailSubject: opts.emailSubject,
    documents: [
      {
        documentBase64: base64,
        name: opts.documentName,
        fileExtension: "pdf",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: opts.signerEmail,
          name: opts.signerName,
          recipientId: "1",
          routingOrder: "1",
        },
      ],
    },
    customFields: opts.agreementId
      ? {
          textCustomFields: [
            {
              name: "ascendra_agreement_id",
              value: String(opts.agreementId),
              show: "false",
            },
          ],
        }
      : undefined,
    status: "sent",
  };

  const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
  return {
    envelopeId: result.envelopeId as string,
    status: (result.status as string) || "sent",
  };
}
