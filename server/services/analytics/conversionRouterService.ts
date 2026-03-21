import crypto from "crypto";

interface ConversionSignalInput {
  eventName: string;
  visitorId?: string | null;
  email?: string | null;
  phone?: string | null;
  sourceUrl?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  value?: number | null;
  currency?: string | null;
  attribution?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

function sha256(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

async function sendGa4MeasurementProtocol(input: ConversionSignalInput): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA4_MEASUREMENT_API_SECRET?.trim();
  if (!measurementId || !apiSecret) return;

  const clientId = input.visitorId || sha256(input.email) || `anon.${Date.now()}`;
  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
      measurementId
    )}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: input.eventName,
            params: {
              source_url: input.sourceUrl ?? undefined,
              value: input.value ?? undefined,
              currency: input.currency ?? undefined,
              ...input.attribution,
              ...input.metadata,
            },
          },
        ],
      }),
    }
  ).catch(() => {});
}

async function sendMetaConversionsApi(input: ConversionSignalInput): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  const userData: Record<string, string> = {};
  const emailHash = sha256(input.email);
  const phoneHash = sha256(input.phone);
  if (emailHash) userData.em = emailHash;
  if (phoneHash) userData.ph = phoneHash;
  if (input.ipAddress) userData.client_ip_address = input.ipAddress;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  await fetch(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(
      accessToken
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: input.eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: input.sourceUrl ?? undefined,
            user_data: userData,
            custom_data: {
              value: input.value ?? undefined,
              currency: input.currency ?? undefined,
              ...input.attribution,
              ...input.metadata,
            },
          },
        ],
      }),
    }
  ).catch(() => {});
}

/**
 * Sends server-side conversion signals to configured channels.
 * This is intentionally non-throwing so lead capture paths never fail because of analytics.
 */
export async function sendConversionSignals(input: ConversionSignalInput): Promise<void> {
  await Promise.all([
    sendGa4MeasurementProtocol(input),
    sendMetaConversionsApi(input),
  ]).catch(() => {});
}
