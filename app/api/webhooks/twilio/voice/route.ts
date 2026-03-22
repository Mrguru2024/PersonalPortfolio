import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { formDataToRecord, twilioRequestUrl, verifyTwilioSignature } from "@server/lib/twilioWebhook";
import { handleVoiceStatusCallback } from "@server/services/revenueOpsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Status callback for inbound voice: missed / busy / failed → optional auto-SMS. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-twilio-signature");
  const formData = await req.formData();
  const params = formDataToRecord(formData);
  const url = twilioRequestUrl(req);
  if (!verifyTwilioSignature(url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  await handleVoiceStatusCallback(storage, {
    CallStatus: params.CallStatus,
    From: params.From,
    To: params.To,
    CallSid: params.CallSid,
    Direction: params.Direction,
  }).catch((e) => console.error("[twilio voice]", e));

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
