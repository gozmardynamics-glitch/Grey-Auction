'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/redux/store';
import { setUser, clearUser } from '@/app/[locale]/(auth)/slices/auth.slice';
import { setWishlist, clearWishlist } from '@/redux/slices/wishlist.slice';
import { apiFetch } from '@/shared/utils/api-client';

/**
 * Bridges the Auth.js session into Redux, and hydrates the server-owned
 * watchlist so hearts render correctly on a cold page load.
 *
 * The session no longer carries the backend bearer token (5.6) — browser
 * requests go through /api/proxy, which attaches it server-side. The Redux
 * `token` field therefore stays empty; nothing should read it for API calls.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const isSignedIn = status === 'authenticated' && Boolean(session?.user);

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
          token: '',
        }),
      );
    } else {
      dispatch(clearUser());
      dispatch(clearWishlist());
    }
  }, [session, status, dispatch]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    apiFetch<{ data: string[] }>('watchlist/ids')
      .then((json) => {
        if (!cancelled && Array.isArray(json?.data)) {
          dispatch(setWishlist(json.data));
        }
      })
      .catch(() => {
        /* anonymous or offline — keep whatever the client already has */
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, dispatch]);

  return null;
}
