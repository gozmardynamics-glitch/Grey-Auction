'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/redux/store';
import { setUser, clearUser } from '@/app/[locale]/(auth)/slices/auth.slice';
import { setWishlist, clearWishlist } from '@/redux/slices/wishlist.slice';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Bridges the Auth.js (NextAuth) JWT session into Redux, and hydrates the
 * server-owned watchlist so hearts render correctly on a cold page load.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const token = session?.user?.accessToken;

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
      dispatch(clearWishlist());
    }
  }, [session, status, dispatch]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_BASE}/watchlist/ids`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && Array.isArray(json?.data)) {
          dispatch(setWishlist(json.data as string[]));
        }
      })
      .catch(() => {
        /* anonymous or offline — keep whatever the client already has */
      });
    return () => {
      cancelled = true;
    };
  }, [token, dispatch]);

  return null;
}
