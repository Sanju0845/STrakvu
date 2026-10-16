import { AuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

// Guard against empty NEXTAUTH_URL in CI/CD and production environments like Vercel
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === '') {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}

// 90 days persistent session duration (in seconds)
const NINETY_DAYS_IN_SECONDS = 90 * 24 * 60 * 60;

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || 'dummy_id',
      clientSecret: process.env.GITHUB_SECRET || 'dummy_secret',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: NINETY_DAYS_IN_SECONDS, // 90 days persistent login across browser closes
    updateAge: 24 * 60 * 60, // Refresh token age every 24 hours
  },
  jwt: {
    maxAge: NINETY_DAYS_IN_SECONDS,
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // @ts-expect-error adding accessToken and username for GitHub API access
        session.accessToken = token.accessToken as string;
        // @ts-expect-error adding username to session user
        session.user.username = (token.username as string) || session.user.name || '';
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        // @ts-expect-error github profile login property
        token.username = profile.login;
      }
      return token;
    },
  },
  // Permanent stable secret to prevent session invalidation on serverless cold starts or restarts
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'strakvu_super_persistent_secret_key_production_stable_2026_xyz',
};
