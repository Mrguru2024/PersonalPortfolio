import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { sendBookingLinkToContact } from "@server/services/revenueOpsService";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  message: z.string().max(1600).optional(),
  urlOverride: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const contact = await storage.getCrmContactById(id);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const user = await getSessionUser(req);
  const result = await sendBookingLinkToContact(storage, contact, parsed.data, user?.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed" }, { status: 400 });
  }
  return NextResponse.json({ success: true, url: result.url });
}
