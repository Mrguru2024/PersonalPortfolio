import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const deals = await storage.getCrmDeals(
      contactId ? Number(contactId) : undefined
    );
    return NextResponse.json(deals);
  } catch (error: any) {
    console.error("Error fetching CRM deals:", error);
    return NextResponse.json({ error: "Failed to fetch CRM deals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const deal = await storage.createCrmDeal({
      contactId: body.contactId,
      title: body.title,
      value: body.value,
      stage: body.stage || "qualification",
      expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
      closedAt: body.closedAt ? new Date(body.closedAt) : null,
      notes: body.notes ?? null,
    });
    return NextResponse.json(deal);
  } catch (error: any) {
    console.error("Error creating CRM deal:", error);
    return NextResponse.json({ error: "Failed to create CRM deal" }, { status: 500 });
  }
}
