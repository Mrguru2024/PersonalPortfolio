import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

/**
 * Set a user as developer (full backend access; only for project owner).
 * Usage: npx tsx scripts/set-developer.ts <email>
 */
async function setDeveloper() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/set-developer.ts <email>");
    process.exit(1);
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    const [updated] = await db
      .update(users)
      .set({
        role: "developer",
        isAdmin: true,
        adminApproved: true,
      })
      .where(eq(users.id, user.id))
      .returning();

    console.log("✅ Developer role set successfully.");
    console.log(`User: ${updated.username} (${updated.email})`);
    console.log(`Role: ${updated.role}, isAdmin: ${updated.isAdmin}, adminApproved: ${updated.adminApproved}`);
    process.exit(0);
  } catch (err: unknown) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

setDeveloper();
