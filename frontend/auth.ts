import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function mapBackendRole(role: string | undefined | null): string {
  if (role === 'admin') return 'admin';
  if (role === 'seller') return 'seller';
  // 'bidder' and anything else -> buyer
  return 'buyer';
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
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const res = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.data?.token || !json?.data?.user) {
            return null;
          }

          const { user, token } = json.data;
          return {
            id: user.id as string,
            email: user.email as string,
            name: (user.name as string) || (user.email as string),
            role: mapBackendRole(user.role),
            accessToken: token as string,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'buyer';
        token.accessToken = (user as any).accessToken || '';
        token.id = (user as any).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token as any).id || '';
        session.user.role = (token as any).role || 'buyer';
        session.user.accessToken = (token as any).accessToken || '';
      }
      return session;
    },
  },
});
