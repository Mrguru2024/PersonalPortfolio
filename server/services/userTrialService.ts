import { storage } from "@server/storage";
import { defaultClientTrialWindow } from "@shared/userTrial";
import { userMatchesSuperAdminIdentity } from "@shared/super-admin-identities";

/** Start the standard client trial window (signup / OAuth). Skips admins, developers, and super-admin identities. */
export async function startDefaultClientTrialForUser(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) return;
  if (user.isAdmin === true) return;
  if (user.role === "admin") return;
  if (userMatchesSuperAdminIdentity({ email: user.email, username: user.username, role: user.role })) {
    return;
  }

  const { trialStartedAt, trialEndsAt } = defaultClientTrialWindow();
  await storage.updateUser(userId, { trialStartedAt, trialEndsAt });
}
