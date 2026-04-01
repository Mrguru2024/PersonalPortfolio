import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { resolveEmailHubSuperUser } from "@server/services/emailHub/emailHubService";

export type EmailHubApiUser = {
  id: number;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  isSuperUser?: boolean;
  isSuper: boolean;
};

export async function requireEmailHubSession(req: NextRequest): Promise<EmailHubApiUser | null> {
  const user = await getSessionUser(req);
  if (!user?.isAdmin || !user.adminApproved) return null;
  const isSuper = resolveEmailHubSuperUser({
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
  });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperUser: user.isSuperUser,
    isSuper,
  };
}
