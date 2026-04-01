import { eq, ilike } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { SUPER_ADMIN_EMAIL } from "@shared/super-admin-email";
import { getSuperAdminUsernames } from "@shared/super-admin-identities";

/**
 * Idempotent: ensure the hard-coded super-admin email (`shared/super-admin-email.ts`) maps to a user
 * with `isAdmin`, `adminApproved`, and a normalized email. Matches by email (case-insensitive) or by
 * `getSuperAdminUsernames()` (e.g. `5epmgllc`) when email is missing or differs.
 */
export async function ensureSuperAdminOwnerAccount(): Promise<{
  ok: boolean;
  userId?: number;
  message: string;
}> {
  const canonicalEmail = SUPER_ADMIN_EMAIL.trim().toLowerCase();

  let [row] = await db.select().from(users).where(ilike(users.email, canonicalEmail)).limit(1);

  if (!row) {
    for (const un of getSuperAdminUsernames()) {
      const [u] = await db.select().from(users).where(eq(users.username, un)).limit(1);
      if (u) {
        row = u;
        break;
      }
    }
  }

  if (!row) {
    return {
      ok: false,
      message: `No user found for super-admin owner (email ${canonicalEmail} or usernames: ${getSuperAdminUsernames().join(", ")}).`,
    };
  }

  const emailNormalized = row.email?.trim().toLowerCase();
  const patch: { email?: string; isAdmin: boolean; adminApproved: boolean } = {
    isAdmin: true,
    adminApproved: true,
  };
  if (!emailNormalized || emailNormalized !== canonicalEmail) {
    patch.email = canonicalEmail;
  }

  await db.update(users).set(patch).where(eq(users.id, row.id));

  const finalEmail = patch.email ?? row.email;
  return {
    ok: true,
    userId: row.id,
    message: `Super-admin owner ensured: user id ${row.id}, email ${finalEmail}, admin + approved.`,
  };
}
