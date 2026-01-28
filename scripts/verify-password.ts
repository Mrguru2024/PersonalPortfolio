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

async function comparePasswords(password: string, hash: string): Promise<boolean> {
  const [hashedPassword, salt] = hash.split(".");
  if (!hashedPassword || !salt) {
    return false;
  }
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return buf.toString("hex") === hashedPassword;
}

async function verifyPassword() {
  try {
    const email = "5epmgllc@gmail.com";
    const testPassword = "Destiny@2028";

    console.log(`Verifying password for account: ${email}...`);

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
    console.log(`Password hash (first 20 chars): ${user.password.substring(0, 20)}...`);

    // Test password comparison
    const isValid = await comparePasswords(testPassword, user.password);
    
    if (isValid) {
      console.log("✅ Password verification successful!");
      console.log(`The password matches the stored hash.`);
    } else {
      console.log("❌ Password verification failed!");
      console.log(`The password does NOT match the stored hash.`);
      console.log("\nResetting password again...");
      
      // Reset the password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(testPassword, salt, 64)) as Buffer;
      const newHash = `${buf.toString("hex")}.${salt}`;
      
      const [updatedUser] = await db
        .update(users)
        .set({
          password: newHash,
        })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log("✅ Password reset again. New hash created.");
      console.log(`New hash (first 20 chars): ${updatedUser.password.substring(0, 20)}...`);
      
      // Verify again
      const isValidAfterReset = await comparePasswords(testPassword, updatedUser.password);
      if (isValidAfterReset) {
        console.log("✅ Password verification successful after reset!");
      } else {
        console.log("❌ Password verification still failed after reset!");
      }
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error verifying password:", error);
    process.exit(1);
  }
}

verifyPassword();
