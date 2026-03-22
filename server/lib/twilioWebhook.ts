import crypto from "crypto";
import type { NextRequest } from "next/server";

/** Twilio signs the full URL (no query string) + concatenated POST params (sorted by key). */
export function verifyTwilioSignature(
  requestUrl: string,
  params: Record<string, string>,
  twilioSignature: string | null
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !twilioSignature) return false;
  const sortedKeys = Object.keys(params).sort();
  let payload = requestUrl;
  for (const key of sortedKeys) {
    payload += key + params[key];
  }
  const expected = crypto.createHmac("sha1", token).update(payload, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(twilioSignature));
  } catch {
    return false;
  }
}

export function twilioRequestUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? (req.nextUrl.protocol === "https:" ? "https" : "http");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}${req.nextUrl.pathname}`;
}

export function formDataToRecord(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
