import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const account = await storage.getCrmAccountById(id);
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error("Error fetching CRM account:", error);
    return NextResponse.json({ error: "Failed to fetch CRM account" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json();
    const account = await storage.updateCrmAccount(id, body);
    return NextResponse.json(account);
  } catch (error: unknown) {
    console.error("Error updating CRM account:", error);
    return NextResponse.json({ error: "Failed to update CRM account" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(_req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmAccount(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting CRM account:", error);
    return NextResponse.json({ error: "Failed to delete CRM account" }, { status: 500 });
  }
}
