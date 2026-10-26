import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: string;
    /** Carried from authorize() into the JWT only — never onto the session. */
    accessToken?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      // No accessToken here on purpose (5.6): the session object is readable by
      // client JavaScript. Server code reads the JWT via getToken().
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
    id?: string;
  }
}
