import { api } from '@/redux/api';
import type { Auction, AuctionFilters, Bid, CreateAuctionData } from '../models';

const auctionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuctions: builder.query<Auction[], AuctionFilters | void>({
      query: (filters) => ({
        url: '/auctions',
        params: filters
          ? {
              categories: filters.categories.join(','),
              countries: filters.countries.join(','),
              brands: filters.brands.join(','),
              priceMin: filters.priceRange[0],
              priceMax: filters.priceRange[1],
              sortBy: filters.sortBy,
            }
          : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Auction' as const, id })),
              { type: 'Auction', id: 'LIST' },
            ]
          : [{ type: 'Auction', id: 'LIST' }],
    }),

    getFeaturedAuctions: builder.query<Auction[], void>({
      query: () => '/auctions/featured',
      providesTags: [{ type: 'Auction', id: 'FEATURED' }],
    }),

    getAuctionById: builder.query<Auction, string>({
      query: (id) => `/auctions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Auction', id }],
    }),

    createAuction: builder.mutation<Auction, CreateAuctionData>({
      // POST /products (JSON). The backend has no /auctions route; image
      // upload needs a dedicated endpoint and is a pre-existing gap.
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: {
          title: data.title,
          description: data.description,
          startingBid: data.startingBid,
          endTime: data.endTime.toISOString(),
          category: data.category,
          ...(data.hasReservePrice !== undefined && {
            hasReservePrice: data.hasReservePrice,
          }),
          ...(data.reservePrice !== undefined && {
            reservePrice: data.reservePrice,
          }),
          ...(data.reservePriceVisibility && {
            reservePriceVisibility: data.reservePriceVisibility,
          }),
          ...(data.allowBuyNow !== undefined && {
            allowBuyNow: data.allowBuyNow,
          }),
          ...(data.buyNowPrice !== undefined && {
            buyNowPrice: data.buyNowPrice,
          }),
          ...(data.minBidIncrement !== undefined && {
            minBidIncrement: data.minBidIncrement,
          }),
          ...(data.escrowReleaseHours !== undefined && {
            escrowReleaseHours: data.escrowReleaseHours,
          }),
        },
      }),
      invalidatesTags: [{ type: 'Auction', id: 'LIST' }],
    }),

    updateAuction: builder.mutation<Auction, { id: string; data: Partial<Auction> }>({
      query: ({ id, data }) => ({
        url: `/auctions/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Auction', id },
        { type: 'Auction', id: 'LIST' },
      ],
    }),

    deleteAuction: builder.mutation<void, string>({
      query: (id) => ({ url: `/auctions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Auction', id },
        { type: 'Auction', id: 'LIST' },
      ],
    }),

    // ─── Bids ───────────────────────────────────────────────────────

    getAuctionBids: builder.query<Bid[], string>({
      query: (auctionId) => `/auctions/${auctionId}/bids`,
      providesTags: (_result, _error, auctionId) => [
        { type: 'Bid', id: auctionId },
      ],
    }),

    placeBid: builder.mutation<Bid, { auctionId: string; amount: number }>({
      query: ({ auctionId, amount }) => ({
        url: `/auctions/${auctionId}/bids`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: (_result, _error, { auctionId }) => [
        { type: 'Bid', id: auctionId },
        { type: 'Auction', id: auctionId },
      ],
    }),

    // ─── User-scoped ────────────────────────────────────────────────

    getUserAuctions: builder.query<Auction[], string>({
      query: (userId) => `/users/${userId}/auctions`,
      providesTags: [{ type: 'Auction', id: 'LIST' }],
    }),

    getUserBids: builder.query<Bid[], string>({
      query: (userId) => `/users/${userId}/bids`,
      providesTags: [{ type: 'Bid', id: 'USER' }],
    }),
  }),
});

export const {
  useGetAuctionsQuery,
  useGetFeaturedAuctionsQuery,
  useGetAuctionByIdQuery,
  useCreateAuctionMutation,
  useUpdateAuctionMutation,
  useDeleteAuctionMutation,
  useGetAuctionBidsQuery,
  usePlaceBidMutation,
  useGetUserAuctionsQuery,
  useGetUserBidsQuery,
} = auctionsApi;
