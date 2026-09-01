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
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: (session.user.role as 'admin' | 'seller' | 'buyer') || 'buyer',
          },
          token: session.user.accessToken || '',
        }),
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, status, dispatch]);

  return null;
}
