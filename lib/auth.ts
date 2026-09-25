import { AuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

// Guard against empty NEXTAUTH_URL in CI/CD environments like Vercel
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === '') {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}

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
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'strakvu_secret_development_token',
};
