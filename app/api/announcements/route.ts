import { NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await storage.getPublicAnnouncements();
    return NextResponse.json(announcements);
  } catch (error: unknown) {
    console.error("Error fetching public announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
