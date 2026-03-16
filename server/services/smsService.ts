/**
 * SMS service (Twilio). Sends SMS when TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER are set.
 */

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  return { accountSid, authToken, fromNumber };
}

export function isSmsConfigured(): boolean {
  const { accountSid, authToken, fromNumber } = getConfig();
  return !!(accountSid && authToken && fromNumber);
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const { accountSid, authToken, fromNumber } = getConfig();
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.");
    return { ok: false, error: "SMS not configured" };
  }
  const normalizedTo = to.replace(/\D/g, "");
  if (normalizedTo.length < 10) {
    return { ok: false, error: "Invalid phone number" };
  }
  const toE164 = normalizedTo.length === 10 ? `+1${normalizedTo}` : `+${normalizedTo}`;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: new URLSearchParams({
        To: toE164,
        From: fromNumber,
        Body: body.slice(0, 1600),
      }),
    });
    const data = (await res.json()) as { sid?: string; message?: string; code?: number };
    if (!res.ok) {
      console.error("Twilio SMS error:", data);
      return { ok: false, error: data.message || String(res.status) };
    }
    console.log(`✅ SMS sent to ${toE164} (sid: ${data.sid})`);
    return { ok: true };
  } catch (e) {
    console.error("SMS send error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
