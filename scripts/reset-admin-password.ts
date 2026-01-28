import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function resetAdminPassword() {
  try {
    // Get credentials from environment variables or command line arguments
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const newPassword = process.env.ADMIN_PASSWORD || process.argv[3];
    
    if (!email || !newPassword) {
      console.error('❌ Error: Email and password are required!');
      console.error('\nUsage:');
      console.error('  ADMIN_EMAIL=email@example.com ADMIN_PASSWORD=password npx tsx scripts/reset-admin-password.ts');
      console.error('  OR');
      console.error('  npx tsx scripts/reset-admin-password.ts <email> <password>');
      console.error('\n⚠️  Never commit credentials to the repository!');
      process.exit(1);
    }

    console.log(`Resetting password for admin account: ${email}...`);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.username} (ID: ${user.id})`);

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    console.log("✓ Password hashed");

    // Update the password
    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, user.id))
      .returning();

    console.log("✅ Password reset successfully!");
    console.log(`User ID: ${updatedUser.id}`);
    console.log(`Username: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Is Admin: ${updatedUser.isAdmin}`);
    console.log(`Admin Approved: ${updatedUser.adminApproved || false}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
