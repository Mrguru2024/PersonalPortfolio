import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const list = await storage.getCrmSavedListById(id);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const contacts = await storage.getCrmContactsBySavedListFilters(list.filters ?? {});
    return NextResponse.json({ ...list, contacts });
  } catch (error: any) {
    console.error("CRM saved list get error:", error);
    return NextResponse.json({ error: "Failed to load saved list" }, { status: 500 });
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
    const list = await storage.updateCrmSavedList(id, {
      name: body.name,
      filters: body.filters,
    });
    return NextResponse.json(list);
  } catch (error: any) {
    console.error("CRM saved list update error:", error);
    return NextResponse.json({ error: "Failed to update saved list" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deleteCrmSavedList(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("CRM saved list delete error:", error);
    return NextResponse.json({ error: "Failed to delete saved list" }, { status: 500 });
  }
}
