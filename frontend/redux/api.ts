import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

import type { RootState } from './store';

export interface ApiError {
  status: number;
  data: {
    message: string;
    success: boolean;
    errors?: Record<string, string[]>;
    data?: unknown;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithRetry = retry(baseQuery, {
  maxRetries: 1,
});

export const api = createApi({
  reducerPath: 'splitApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['User', 'Profile', 'Auction', 'Bid'],
  endpoints: () => ({}),
});
