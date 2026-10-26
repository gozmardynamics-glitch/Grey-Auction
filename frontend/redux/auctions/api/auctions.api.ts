import { api } from '@/redux/api';
import type { Auction, AuctionFilters, Bid, CreateAuctionData } from '../models';

/**
 * The wire shape of GET /auctions/:id/bids.
 *
 * The backend returns Bid entities with a display-safe bidder projection
 * ({ name } only), so the field names differ from the client `Bid` model
 * (productId/createdAt/bidder vs auctionId/timestamp/bidderName).
 */
export interface ServerBid {
  id: string;
  productId: string;
  bidderId: string;
  amount: string | number;
  createdAt: string;
  bidder?: { name?: string | null } | null;
}

const auctionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuctions: builder.query<Auction[], AuctionFilters | void>({
      query: (filters) => ({
        url: '/products',
        params: filters
          ? {
              category: filters.categories.length === 1 ? filters.categories[0] : undefined,
              subCategory: filters.subCategory || undefined,
              country: filters.countries.length === 1 ? filters.countries[0] : undefined,
              minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
              maxPrice:
                filters.priceRange[1] < 50000000 ? filters.priceRange[1] : undefined,
              sortBy:
                filters.sortBy === 'ending-soon'
                  ? 'ending_soon'
                  : filters.sortBy === 'price-asc'
                    ? 'price_asc'
                    : filters.sortBy === 'price-desc'
                      ? 'price_desc'
                      : filters.sortBy === 'newest'
                        ? 'newest'
                        : undefined,
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
      query: () => '/products/featured',
      providesTags: [{ type: 'Auction', id: 'FEATURED' }],
    }),

    getAuctionById: builder.query<Auction, string>({
      query: (id) => `/products/${id}`,
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
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Auction', id },
        { type: 'Auction', id: 'LIST' },
      ],
    }),

    deleteAuction: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Auction', id },
        { type: 'Auction', id: 'LIST' },
      ],
    }),

    // ─── Bids ───────────────────────────────────────────────────────

    getAuctionBids: builder.query<ServerBid[], string>({
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
      query: (userId) => `/products?sellerId=${userId}`,
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
