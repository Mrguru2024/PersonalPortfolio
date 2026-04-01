import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createBookingPageAdmin,
  listAllBookingTypesAdmin,
  listBookingPagesAdmin,
} from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const [pages, types] = await Promise.all([listBookingPagesAdmin(), listAllBookingTypesAdmin()]);
  return NextResponse.json({ pages, types });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const bookingTypeIdRaw =
    typeof body.bookingTypeId === "number" ? body.bookingTypeId : parseInt(String(body.bookingTypeId ?? ""), 10);
  if (!Number.isFinite(bookingTypeIdRaw)) {
    return NextResponse.json({ error: "bookingTypeId required" }, { status: 400 });
  }
  let fixedHostUserId: number | null = null;
  if (body.fixedHostUserId !== null && body.fixedHostUserId !== undefined && body.fixedHostUserId !== "") {
    const n =
      typeof body.fixedHostUserId === "number" ? body.fixedHostUserId : parseInt(String(body.fixedHostUserId), 10);
    fixedHostUserId = Number.isFinite(n) ? n : null;
  }
  const result = await createBookingPageAdmin({
    slug: String(body.slug ?? ""),
    title: String(body.title ?? ""),
    shortDescription: body.shortDescription,
    bestForBullets: Array.isArray(body.bestForBullets) ? body.bestForBullets.map(String) : undefined,
    bookingTypeId: bookingTypeIdRaw,
    fixedHostUserId,
    hostMode: body.hostMode,
    locationType: body.locationType,
    paymentRequirement: body.paymentRequirement,
    depositCents: body.depositCents,
    confirmationMessage: body.confirmationMessage,
    postBookingNextSteps: body.postBookingNextSteps,
    redirectUrl: body.redirectUrl,
    formFieldsJson: body.formFieldsJson,
    settingsJson: body.settingsJson,
    active: body.active,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ page: result.row });
}
