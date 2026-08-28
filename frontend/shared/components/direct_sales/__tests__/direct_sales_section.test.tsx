import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirectSalesSection } from '../direct_sales_section';
import { CurrencyProvider } from '@/shared/currency';

function makeFetch(items: any[]) {
  return vi.fn((input: any) => {
    const url = String(input);
    if (url.includes('/exchange-rates')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { rates: { NGN: 1, USD: 1500, GHS: 85, EUR: 1650 } } }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ data: items }) });
  }) as unknown as typeof fetch;
}

function renderSection() {
  return render(
    <CurrencyProvider>
      <DirectSalesSection />
    </CurrencyProvider>,
  );
}

describe('DirectSalesSection (L8)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = makeFetch([
      { id: 'p1', slug: 'iphone-15', title: 'iPhone 15 Pro Max', images: ['/placeholder.svg'], buyNowPrice: 980000, city: 'Lagos' },
      { id: 'p2', title: 'Designer Watch', images: [], startingBid: 450000, city: 'Kano' },
    ]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('queries the direct_sale auction type and renders buy-now cards', async () => {
    renderSection();
    const calls = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const productsCall = calls.find((c) => String(c[0]).includes('auctionType=direct_sale'));
    expect(productsCall).toBeTruthy();

    expect(await screen.findByText('iPhone 15 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Designer Watch')).toBeInTheDocument();
    expect(screen.getAllByTestId('direct-sale-card')).toHaveLength(2);
  });

  it('shows an empty state when there are no buy-now lots', async () => {
    global.fetch = makeFetch([]) as unknown as typeof fetch;
    renderSection();
    expect(await screen.findByText(/No buy-now listings/)).toBeInTheDocument();
  });
});
