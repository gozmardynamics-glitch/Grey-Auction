'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/redux/store';
import { setUser, clearUser } from '@/app/[locale]/(auth)/slices/auth.slice';

export function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      dispatch(
        setUser({
          user: {
            id: session.user.id,
            name: session.user.name ?? '',
            email: session.user.email ?? '',
            role: session.user.role as 'admin' | 'seller' | 'buyer',
          },
          token: session.user.backendToken,
        })
      );
    } else if (status === 'unauthenticated') {
      dispatch(clearUser());
    }
  }, [session, status, dispatch]);

  return null;
}
