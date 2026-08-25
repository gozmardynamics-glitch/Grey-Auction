'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { AuthSync } from './auth-sync';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <AuthSync />
        {children}
      </Provider>
    </SessionProvider>
  );
}
