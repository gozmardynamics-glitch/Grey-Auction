import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Auction, Bid, AuctionFilters } from '../models';

interface AuctionsState {
  auctions: Auction[];
  featuredAuctions: Auction[];
  currentAuction: Auction | null;
  bids: Bid[];
  filters: AuctionFilters;
  loading: boolean;
  error: string | null;
}

const initialState: AuctionsState = {
  auctions: [],
  featuredAuctions: [],
  currentAuction: null,
  bids: [],
  filters: {
    categories: [],
    countries: [],
    brands: [],
    priceRange: [0, 50000000],
    sortBy: 'default',
  },
  loading: false,
  error: null,
};

const auctionsSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setAuctions: (state, action: PayloadAction<Auction[]>) => {
      state.auctions = action.payload;
    },
    setFeaturedAuctions: (state, action: PayloadAction<Auction[]>) => {
      state.featuredAuctions = action.payload;
    },
    setCurrentAuction: (state, action: PayloadAction<Auction | null>) => {
      state.currentAuction = action.payload;
    },
    addBid: (state, action: PayloadAction<Bid>) => {
      state.bids.push(action.payload);
      // Update current bid if this is for the current auction
      if (
        state.currentAuction &&
        action.payload.auctionId === state.currentAuction.id
      ) {
        state.currentAuction.currentBid = action.payload.amount;
        state.currentAuction.totalBids += 1;
      }
    },
    setFilters: (state, action: PayloadAction<AuctionFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        categories: [],
        countries: [],
        brands: [],
        priceRange: [0, 50000000],
        sortBy: 'default',
      };
    },
    updateAuctionStatus: (
      state,
      action: PayloadAction<{ id: string; status: Auction['status'] }>
    ) => {
      const { id, status } = action.payload;
      const auction = state.auctions.find((a) => a.id === id);
      if (auction) {
        auction.status = status;
      }
      if (state.currentAuction && state.currentAuction.id === id) {
        state.currentAuction.status = status;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setAuctions,
  setFeaturedAuctions,
  setCurrentAuction,
  addBid,
  setFilters,
  clearFilters,
  updateAuctionStatus,
} = auctionsSlice.actions;

export default auctionsSlice.reducer;
