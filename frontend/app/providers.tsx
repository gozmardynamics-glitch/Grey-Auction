'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ClerkProvider } from '@clerk/nextjs';
import { store } from '@/redux/store';
import { AuthSync } from './auth-sync';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <Provider store={store}>
        <AuthSync />
        {children}
      </Provider>
    </ClerkProvider>
  );
}
