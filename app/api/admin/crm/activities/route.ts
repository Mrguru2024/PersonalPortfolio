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
    if (!contactId) {
      return NextResponse.json({ error: "contactId required" }, { status: 400 });
    }
    const activities = await storage.getCrmActivities(Number(contactId));
    return NextResponse.json(activities);
  } catch (error: any) {
    console.error("Error fetching CRM activities:", error);
    return NextResponse.json({ error: "Failed to fetch CRM activities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json();
    const activity = await storage.createCrmActivity({
      contactId: body.contactId,
      dealId: body.dealId ?? null,
      type: body.type,
      subject: body.subject ?? null,
      body: body.body ?? null,
    });
    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("Error creating CRM activity:", error);
    return NextResponse.json({ error: "Failed to create CRM activity" }, { status: 500 });
  }
}
