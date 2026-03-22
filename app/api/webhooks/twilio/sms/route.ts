import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { formDataToRecord, twilioRequestUrl as buildTwilioUrl, verifyTwilioSignature } from "@server/lib/twilioWebhook";
import { handleInboundSms } from "@server/services/revenueOpsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-twilio-signature");
  const formData = await req.formData();
  const params = formDataToRecord(formData);
  const url = buildTwilioUrl(req);
  if (!verifyTwilioSignature(url, params, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = params.Body ?? "";
  const from = params.From ?? "";
  if (from) {
    await handleInboundSms(storage, from, body, params.MessageSid ?? "").catch((e) =>
      console.error("[twilio sms inbound]", e)
    );
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
