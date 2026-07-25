import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

// TODO: Remove mock users when backend is ready
const MOCK_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@auctions.com', password: 'password', role: 'admin', token: 'mock-jwt-admin' },
  { id: '2', name: 'Seller User', email: 'seller@auctions.com', password: 'password', role: 'seller', token: 'mock-jwt-seller' },
  { id: '3', name: 'Buyer User', email: 'buyer@auctions.com', password: 'password', role: 'buyer', token: 'mock-jwt-buyer' },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Try real backend first
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              backendToken: data.token,
            };
          }
        } catch {
          // Backend unavailable — fall through to mock
        }

        // TODO: Remove mock fallback when backend is ready
        const mock = MOCK_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );
        if (!mock) return null;

        return {
          id: mock.id,
          name: mock.name,
          email: mock.email,
          role: mock.role,
          backendToken: mock.token,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in
      if (user) {
        token.role = user.role;
        token.backendToken = user.backendToken;
      }

      // Google OAuth: exchange Google token for backend token
      if (account?.provider === 'google') {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken: account.id_token,
                accessToken: account.access_token,
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            token.role = data.user.role;
            token.backendToken = data.token;
          }
        } catch {
          // Backend unavailable — token will lack role/backendToken
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.backendToken = token.backendToken as string;
      }
      return session;
    },
  },
});
