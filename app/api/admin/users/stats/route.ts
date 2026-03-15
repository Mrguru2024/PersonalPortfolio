import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

/**
 * GET /api/admin/users/stats
 * Returns counts for user management overview (super user only).
 * Used to show CRM leads/clients and newsletter subscribers without loading full lists.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const [contacts, subscribers] = await Promise.all([
      storage.getCrmContacts().catch(() => []),
      storage.getAllSubscribers(false).catch(() => []),
    ]);

    const crmLeadsCount = contacts.filter((c) => c.type === "lead").length;
    const crmClientsCount = contacts.filter((c) => c.type === "client").length;
    const subscribersCount = subscribers.length;

    return NextResponse.json({
      crmLeadsCount,
      crmClientsCount,
      subscribersCount,
    });
  } catch (error: any) {
    console.error("Error fetching user management stats:", error);
    return NextResponse.json(
      { message: "Error fetching stats" },
      { status: 500 }
    );
  }
}
