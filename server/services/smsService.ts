/**
 * SMS service (Twilio). Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and either TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID.
 */

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  return { accountSid, authToken, fromNumber, messagingServiceSid };
}

export function isSmsConfigured(): boolean {
  const { accountSid, authToken, fromNumber, messagingServiceSid } = getConfig();
  return !!(accountSid && authToken && (fromNumber || messagingServiceSid));
}

export async function sendSms(
  to: string,
  body: string,
  opts?: { statusCallback?: string }
): Promise<{ ok: boolean; error?: string; messageSid?: string }> {
  const { accountSid, authToken, fromNumber, messagingServiceSid } = getConfig();
  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    console.warn(
      "SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID."
    );
    return { ok: false, error: "SMS not configured" };
  }
  const normalizedTo = to.replace(/\D/g, "");
  if (normalizedTo.length < 10) {
    return { ok: false, error: "Invalid phone number" };
  }
  const toE164 = normalizedTo.length === 10 ? `+1${normalizedTo}` : `+${normalizedTo}`;
  const params = new URLSearchParams();
  params.set("To", toE164);
  params.set("Body", body.slice(0, 1600));
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    params.set("From", fromNumber);
  }
  const statusCb = opts?.statusCallback ?? process.env.TWILIO_STATUS_CALLBACK_URL;
  if (statusCb) params.set("StatusCallback", statusCb);

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body: params,
    });
    const data = (await res.json()) as { sid?: string; message?: string; code?: number };
    if (!res.ok) {
      console.error("Twilio SMS error:", res.status, data.code, data.message);
      return { ok: false, error: data.message || String(res.status) };
    }
    console.log("SMS sent", data.sid ? { sid: data.sid } : {});
    return { ok: true, messageSid: data.sid };
  } catch (e) {
    console.error("SMS send error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Send failed" };
  }
}
