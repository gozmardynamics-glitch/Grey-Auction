import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { CredentialsSignin } from 'next-auth';

import { SERVER_API_BASE } from '@/lib/api-base';

const API_BASE = SERVER_API_BASE;

/**
 * Normalises the backend role for UI routing.
 *
 * The account holder IS the seller: Product.sellerId references their user id,
 * so owning lots is not a separate identity. `seller` and `bidder` therefore
 * describe what the account holder is doing, not two different people — the
 * session role is only used to pick a default dashboard, never to gate
 * ownership (their own lots come from GET /products/mine).
 */
function mapBackendRole(role: string | undefined | null): string {
  if (role === 'admin') return 'admin';
  if (role === 'seller') return 'seller';
  // 'bidder' and anything else -> buyer
  return 'buyer';
}

/**
 * Carries the backend's reason back to the sign-in screen.
 *
 * Auth.js puts `code` on the redirect URL, and `signIn()` from next-auth/react
 * returns it, so the login page can tell "wrong password" from "we need your
 * authenticator code" without guessing from the message text.
 */
class BackendSignInError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/auth/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        code: { label: 'Authentication code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const code = (credentials?.code as string | undefined) || undefined;
        if (!email || !password) return null;

        try {
          const res = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // The second factor rides along in the same call, so no
            // half-authenticated credential ever exists between the two steps.
            body: JSON.stringify({ email, password, ...(code ? { code } : {}) }),
          });
          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.data?.token || !json?.data?.user) {
            // MFA_REQUIRED / MFA_ENROLMENT_REQUIRED reach the client as a code;
            // everything else stays deliberately vague.
            throw new BackendSignInError(
              typeof json?.code === 'string' ? json.code : 'invalid_credentials',
            );
          }

          const { user, token } = json.data;
          return {
            id: user.id as string,
            email: user.email as string,
            name: (user.name as string) || (user.email as string),
            role: mapBackendRole(user.role),
            accessToken: token as string,
          };
        } catch (error) {
          // Re-throw our own code untouched; anything else (network, parse) is a
          // plain failed sign-in.
          if (error instanceof CredentialsSignin) throw error;
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'buyer';
        token.accessToken = user.accessToken || '';
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || '';
        session.user.role = token.role || 'buyer';
        // The backend bearer token stays ONLY in the encrypted JWT cookie.
        // Session objects are client-readable, so exposing it here meant any
        // XSS could lift a full API token (5.6). Browser calls go through
        // /api/proxy, which reads the cookie server-side.
      }
      return session;
    },
  },
});
