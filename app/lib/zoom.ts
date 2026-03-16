/**
 * Zoom Server-to-Server OAuth: config check, token fetch, and create meeting.
 * Env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 */

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

async function getAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.");
  }
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Zoom token response missing access_token");
  return data.access_token;
}

export interface CreateZoomMeetingInput {
  topic: string;
  startTime: string;
  durationMinutes: number;
  timezone?: string;
  agenda?: string;
}

export interface CreateZoomMeetingResult {
  id: string;
  joinUrl: string;
  startUrl: string;
  startTime: string;
  duration: number;
}

export async function createZoomMeeting(
  input: CreateZoomMeetingInput
): Promise<CreateZoomMeetingResult> {
  const token = await getAccessToken();
  const startTime = input.startTime.endsWith("Z") ? input.startTime : `${input.startTime.replace(/Z?$/, "")}Z`;
  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: startTime,
      duration: input.durationMinutes,
      timezone: input.timezone ?? "UTC",
      agenda: input.agenda ?? undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom create meeting failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    id?: number;
    join_url?: string;
    start_url?: string;
    start_time?: string;
    duration?: number;
  };
  return {
    id: String(data.id ?? ""),
    joinUrl: data.join_url ?? "",
    startUrl: data.start_url ?? "",
    startTime: data.start_time ?? startTime,
    duration: data.duration ?? input.durationMinutes,
  };
}

export interface TestZoomConnectionResult {
  ok: boolean;
  message?: string;
}

export async function testZoomConnection(): Promise<TestZoomConnectionResult> {
  if (!isZoomConfigured()) {
    return {
      ok: false,
      message: "Zoom not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.",
    };
  }
  try {
    await getAccessToken();
    return {
      ok: true,
      message: "Zoom Server-to-Server OAuth is valid. You can create meetings.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}
