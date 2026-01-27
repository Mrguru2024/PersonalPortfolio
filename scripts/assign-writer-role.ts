import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to assign writer role to a user
 * Usage: tsx scripts/assign-writer-role.ts <username>
 */

async function assignWriterRole(username: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      console.error(`User "${username}" not found.`);
      process.exit(1);
    }

    await db
      .update(users)
      .set({ role: "writer" })
      .where(eq(users.username, username));

    console.log(`✅ Successfully assigned "writer" role to user: ${username}`);
    console.log(`   User can now create blog posts.`);
  } catch (error) {
    console.error("Error assigning writer role:", error);
    process.exit(1);
  }
}

const username = process.argv[2];

if (!username) {
  console.error("Usage: tsx scripts/assign-writer-role.ts <username>");
  process.exit(1);
}

assignWriterRole(username)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
