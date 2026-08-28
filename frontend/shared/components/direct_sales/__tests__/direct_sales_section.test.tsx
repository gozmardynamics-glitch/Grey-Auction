import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirectSalesSection } from '../direct_sales_section';

describe('DirectSalesSection (L8)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'p1', slug: 'iphone-15', title: 'iPhone 15 Pro Max', images: ['/placeholder.svg'], buyNowPrice: 980000, city: 'Lagos' },
          { id: 'p2', title: 'Designer Watch', images: [], startingBid: 450000, city: 'Kano' },
        ],
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('queries the direct_sale auction type and renders buy-now cards', async () => {
    render(<DirectSalesSection />);
    const url = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(String(url)).toContain('auctionType=direct_sale');

    expect(await screen.findByText('iPhone 15 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Designer Watch')).toBeInTheDocument();
    expect(screen.getAllByTestId('direct-sale-card')).toHaveLength(2);
  });

  it('shows an empty state when there are no buy-now lots', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    render(<DirectSalesSection />);
    expect(await screen.findByText(/No buy-now listings/)).toBeInTheDocument();
  });
});
