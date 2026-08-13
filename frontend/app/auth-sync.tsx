'use client';

import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useAppDispatch } from '@/redux/store';
import { setUser, clearUser } from '@/app/[locale]/(auth)/slices/auth.slice';

const METADATA_ROLE = {
  admin: 'admin',
  seller: 'seller',
  buyer: 'buyer',
  bidder: 'buyer',
} as const;

export function AuthSync() {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      dispatch(clearUser());
      return;
    }

    const rawRole = (user.publicMetadata?.role as string) || 'buyer';
    const role = (METADATA_ROLE as Record<string, 'admin' | 'seller' | 'buyer'>)[rawRole] ?? 'buyer';

    // Fetch the Clerk session token for backend API calls
    getToken().then((token) => {
      dispatch(
        setUser({
          user: {
            id: user.id,
            name: user.fullName || user.primaryEmailAddress?.emailAddress || '',
            email: user.primaryEmailAddress?.emailAddress || '',
            role,
          },
          token: token ?? '',
        }),
      );
    });
  }, [user, isLoaded, isSignedIn, getToken, dispatch]);

  return null;
}
