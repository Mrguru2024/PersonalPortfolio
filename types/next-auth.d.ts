import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID. */
      id?: string;
      /** Whether the user is an admin or not. */
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}