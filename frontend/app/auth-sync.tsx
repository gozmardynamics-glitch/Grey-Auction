'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/redux/store';
import { setUser, clearUser } from '@/app/[locale]/(auth)/slices/auth.slice';

/**
 * Bridges the Auth.js (NextAuth) JWT session into Redux.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      dispatch(
        setUser({
          user: {
            id: (session.user as any).id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: (session.user as any).role || 'buyer',
          },
          token: (session.user as any).accessToken || '',
        }),
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, status, dispatch]);

  return null;
}
