/**
 * GET /api/challenge/progress?registrationId=1 — get lesson progress.
 * POST /api/challenge/progress — body: { registrationId, day } — mark day complete.
 */

import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const registrationId = req.nextUrl.searchParams.get("registrationId");
    const id = registrationId ? parseInt(registrationId, 10) : NaN;
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }
    const reg = await storage.getChallengeRegistrationById(id);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    const progress = await storage.getChallengeLessonProgress(id);
    return NextResponse.json({ progress });
  } catch (e) {
    console.error("Challenge progress GET error:", e);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const registrationId = body.registrationId != null ? Number(body.registrationId) : NaN;
    const day = body.day != null ? Number(body.day) : NaN;
    if (!registrationId || Number.isNaN(registrationId) || !day || day < 1 || day > 5) {
      return NextResponse.json({ error: "registrationId and day (1-5) required" }, { status: 400 });
    }
    const reg = await storage.getChallengeRegistrationById(registrationId);
    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    await storage.setChallengeLessonCompleted(registrationId, day);
    const progress = await storage.getChallengeLessonProgress(registrationId);
    return NextResponse.json({ ok: true, progress });
  } catch (e) {
    console.error("Challenge progress POST error:", e);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
