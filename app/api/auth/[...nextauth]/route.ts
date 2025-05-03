import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { getDb } from '../../../db';
import { users } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return Buffer.compare(hashedBuf, suppliedBuf) === 0;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const { db } = getDb();
          
          // Find the user
          const user = await db.query.users.findFirst({
            where: eq(users.username, credentials.username),
          });

          if (!user) return null;

          // Verify password
          const passwordValid = await comparePasswords(credentials.password, user.password);
          if (!passwordValid) return null;
          
          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email,
            image: user.avatarUrl,
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Add custom user data to token
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }

      // Handle GitHub sign-in
      if (account?.provider === 'github' && profile) {
        try {
          const { db } = getDb();
          // Check if user with this GitHub ID exists already
          let dbUser = await db.query.users.findFirst({
            where: eq(users.email, profile.email || ''),
          });

          if (!dbUser) {
            // Create a new user
            const [newUser] = await db.insert(users).values({
              username: profile.login || profile.name?.replace(/\s+/g, '') || 'github_user',
              email: profile.email || `${profile.id}@github.user`,
              password: 'github_oauth_no_password',
              avatarUrl: profile.avatar_url,
              githubId: profile.id,
              isAdmin: false,
              createdAt: new Date(),
            }).returning();
            
            dbUser = newUser;
          } else if (!dbUser.githubId) {
            // Update existing user with GitHub data
            await db.update(users)
              .set({ 
                githubId: profile.id, 
                avatarUrl: profile.avatar_url || dbUser.avatarUrl 
              })
              .where(eq(users.id, dbUser.id));
          }

          token.id = dbUser.id.toString();
          token.isAdmin = dbUser.isAdmin;
        } catch (error) {
          console.error('GitHub auth error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
          isAdmin: token.isAdmin as boolean,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };