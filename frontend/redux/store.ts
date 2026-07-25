'use client';

import { configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';

import { authSlice } from '@/app/[locale]/(auth)/slices/auth.slice';
import auctionsReducer from '@/redux/auctions/slices/auctions.slice';
import uiReducer from '@/redux/slices/ui.slice';
import categoriesReducer from '@/redux/slices/categories.slice';
import wishlistReducer from '@/redux/slices/wishlist.slice';
import biddingReducer from '@/redux/slices/bidding.slice';

import walletReducer from '@/redux/slices/wallet.slice';
import { api } from '@/redux/api';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      auctions: auctionsReducer,
      ui: uiReducer,
      categories: categoriesReducer,
      wishlist: wishlistReducer,
      bidding: biddingReducer,

      wallet: walletReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ['auctions.auctions'],
          ignoredActions: ['auctions/setAuctions'],
        },
      }).concat(api.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const store = makeStore();
