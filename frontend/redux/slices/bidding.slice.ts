import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Bid } from '@/app/[locale]/(website)/models';

interface BiddingState {
  currentBid: number;
  bidHistory: Bid[];
  isBidding: boolean;
  bidError: string | null;
  timeLeft: number;
  autoBid: {
    enabled: boolean;
    maxAmount: number;
  };
  currentAuctionId: string | null;
}

const initialState: BiddingState = {
  currentBid: 0,
  bidHistory: [],
  isBidding: false,
  bidError: null,
  timeLeft: 0,
  autoBid: {
    enabled: false,
    maxAmount: 0,
  },
  currentAuctionId: null,
};

const biddingSlice = createSlice({
  name: 'bidding',
  initialState,
  reducers: {
    setCurrentAuction: (state, action: PayloadAction<string>) => {
      state.currentAuctionId = action.payload;
      state.currentBid = 0;
      state.bidHistory = [];
      state.bidError = null;
    },
    setCurrentBid: (state, action: PayloadAction<number>) => {
      state.currentBid = action.payload;
    },
    placeBid: (
      state,
      action: PayloadAction<{
        amount: number;
        auctionId: string;
        bidderId: string;
        bidderName: string;
      }>
    ) => {
      const bid: Bid = {
        id: Date.now().toString(),
        amount: action.payload.amount,
        auctionId: action.payload.auctionId,
        timestamp: new Date(),
        bidderId: action.payload.bidderId,
        bidderName: action.payload.bidderName,
      };
      state.bidHistory.unshift(bid);
      state.currentBid = action.payload.amount;
    },
    setBidding: (state, action: PayloadAction<boolean>) => {
      state.isBidding = action.payload;
    },
    setBidError: (state, action: PayloadAction<string | null>) => {
      state.bidError = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    decrementTimeLeft: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft -= 1;
      }
    },
    setAutoBid: (
      state,
      action: PayloadAction<{ enabled: boolean; maxAmount: number }>
    ) => {
      state.autoBid = action.payload;
    },
    clearBiddingState: (state) => {
      state.currentAuctionId = null;
      state.currentBid = 0;
      state.bidHistory = [];
      state.bidError = null;
      state.timeLeft = 0;
      state.autoBid = { enabled: false, maxAmount: 0 };
    },
  },
});

export const {
  setCurrentAuction,
  setCurrentBid,
  placeBid,
  setBidding,
  setBidError,
  setTimeLeft,
  decrementTimeLeft,
  setAutoBid,
  clearBiddingState,
} = biddingSlice.actions;

export default biddingSlice.reducer;
