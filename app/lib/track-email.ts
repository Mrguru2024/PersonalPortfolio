import * as crypto from "crypto";

function getTrackingHmacSecret(): string {
  const tracking = process.env.TRACKING_SIGNATURE_SECRET?.trim();
  if (tracking) return tracking;
  const session = process.env.SESSION_SECRET?.trim();
  if (session) return session;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[security] Set TRACKING_SIGNATURE_SECRET or SESSION_SECRET for email open/click HMAC in production.",
    );
  }
  return "dev-email-tracking-hmac-secret";
}

export function signEmailTrackingPayload(leadId: number, emailId: string): string {
  const payload = `${leadId}:${emailId}`;
  const sig = crypto
    .createHmac("sha256", getTrackingHmacSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyEmailTrackingToken(token: string): { leadId: number; emailId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [leadIdStr, emailId, sig] = decoded.split(":");
    if (!leadIdStr || !emailId || !sig) return null;
    const leadId = parseInt(leadIdStr, 10);
    if (Number.isNaN(leadId)) return null;
    const payload = `${leadId}:${emailId}`;
    const expected = crypto
      .createHmac("sha256", getTrackingHmacSecret())
      .update(payload)
      .digest("hex");
    if (expected !== sig) return null;
    return { leadId, emailId };
  } catch {
    return null;
  }
}
