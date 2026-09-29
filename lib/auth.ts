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

// 30 days persistent session duration (in seconds)
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

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
    maxAge: THIRTY_DAYS_IN_SECONDS, // 30 days persistent login across browser closes
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: THIRTY_DAYS_IN_SECONDS,
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
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // 'lax' preserves persistent authentication across browser restarts and tab opens
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: THIRTY_DAYS_IN_SECONDS, // Ensures cookie is NOT a temporary session-only cookie
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: THIRTY_DAYS_IN_SECONDS,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: THIRTY_DAYS_IN_SECONDS,
      },
    },
  },
  // Stable secret to avoid session invalidation across Vercel serverless cold starts
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'strakvu_super_persistent_secret_key_2026',
};
