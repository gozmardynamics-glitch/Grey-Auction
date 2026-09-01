import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RateEstimator } from '../rate_estimator';

describe('RateEstimator (L5)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { method: 'delivery', cost: 3000, currency: 'NGN', weightKg: 25, breakdown: [{ label: 'Base delivery', amount: 2500 }, { label: 'Weight surcharge', amount: 500 }] },
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('requests a quote and renders the cost', async () => {
    const user = userEvent.setup();
    render(<RateEstimator />);
    await user.click(screen.getByTestId('rate-submit'));

    const [url, opts] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/shipping/rates');
    expect(JSON.parse(opts.body)).toMatchObject({ method: 'delivery', city: 'Lagos' });
    expect(await screen.findByTestId('rate-quote')).toBeInTheDocument();
    expect(screen.getByText(/Base delivery/)).toBeInTheDocument();
  });

  it('defaults to the delivery method', () => {
    render(<RateEstimator />);
    expect(screen.getByTestId('rate-method')).toHaveValue('delivery');
  });
});
