import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Check admin access
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const contacts = await storage.getAllContacts();
    const serialized = contacts.map((c) => {
      const raw = c.createdAt;
      const createdAt =
        typeof raw === "string"
          ? raw
          : (raw as object) instanceof Date
            ? (raw as Date).toISOString()
            : String(raw);
      return { ...c, createdAt };
    });
    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    const details =
      process.env.NODE_ENV === "development" && error?.message
        ? error.message
        : undefined;
    return NextResponse.json(
      { error: "Failed to fetch contacts", ...(details && { details }) },
      { status: 500 }
    );
  }
}
