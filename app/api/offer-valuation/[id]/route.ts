import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  resolveAscendraAccessFromSessionUser,
} from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asId(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser(req);
    const role = resolveAscendraAccessFromSessionUser(sessionUser);
    if (role === "PUBLIC") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const id = asId((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const row = await storage.getOfferValuationById(id);
    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (role !== "ADMIN" && Number(sessionUser?.id) !== row.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("GET /api/offer-valuation/[id]:", error);
    return NextResponse.json(
      { message: "Failed to load valuation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getSessionUser(req);
    const role = resolveAscendraAccessFromSessionUser(sessionUser);
    if (role === "PUBLIC") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const id = asId((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const row = await storage.getOfferValuationById(id);
    if (!row) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (role !== "ADMIN" && Number(sessionUser?.id) !== row.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await storage.deleteOfferValuation(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/offer-valuation/[id]:", error);
    return NextResponse.json(
      { message: "Failed to delete valuation" },
      { status: 500 },
    );
  }
}

