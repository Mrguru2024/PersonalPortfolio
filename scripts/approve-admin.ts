import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function approveAdmin() {
  try {
    const email = "5epmgllc@gmail.com";

    console.log(`Approving admin account: ${email}...`);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    if (!user.isAdmin) {
      console.error(`❌ User ${email} is not an admin!`);
      process.exit(1);
    }

    if (user.adminApproved) {
      console.log(`✓ User ${email} is already approved.`);
      process.exit(0);
    }

    console.log(`✓ Found admin user: ${user.username} (ID: ${user.id})`);

    // Approve the admin
    const [updatedUser] = await db
      .update(users)
      .set({
        adminApproved: true,
      })
      .where(eq(users.id, user.id))
      .returning();

    console.log("✅ Admin account approved successfully!");
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Username: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Is Admin: ${updatedUser.isAdmin}`);
    console.log(`Admin Approved: ${updatedUser.adminApproved}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error approving admin:", error);
    process.exit(1);
  }
}

approveAdmin();
