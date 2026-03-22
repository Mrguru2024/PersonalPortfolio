import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json(await storage.listPpcAdAccounts());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const platform = typeof body.platform === "string" ? body.platform : "";
    const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
    const externalAccountId = typeof body.externalAccountId === "string" ? body.externalAccountId.trim() : "";
    if (!nickname || !externalAccountId || !["google_ads", "meta"].includes(platform)) {
      return NextResponse.json({ error: "platform (google_ads|meta), nickname, externalAccountId required" }, { status: 400 });
    }
    const row = await storage.createPpcAdAccount({
      platform,
      nickname,
      externalAccountId,
      managerCustomerId: typeof body.managerCustomerId === "string" ? body.managerCustomerId.trim() : null,
      status: "active",
      metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
      isDefault: !!body.isDefault,
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
