import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/auth/login' },
  providers: [],
} satisfies NextAuthConfig;
