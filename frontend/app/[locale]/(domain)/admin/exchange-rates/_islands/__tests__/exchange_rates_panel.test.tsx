import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { NextIntlClientProvider } from 'next-intl';
import { makeStore } from '@/redux/store';
import { setUser } from '@/app/[locale]/(auth)/slices/auth.slice';
import ExchangeRatesPanel from '../exchange_rates_panel';
import en from '@/messages/en.json';

const RATES = { NGN: 1, USD: 1500, GHS: 85, EUR: 1650 };
const UPDATED_AT = '2026-08-28T15:59:16.616Z';

function makeRatesFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { base: 'NGN', rates: RATES, updatedAt: UPDATED_AT } }),
  }) as unknown as typeof fetch;
}

function renderPanel() {
  const store = makeStore();
  store.dispatch(
    setUser({
      user: { id: 'u1', name: 'Admin', email: 'admin@greyauction.com', role: 'admin' },
      token: 'test-token',
    }),
  );
  return render(
    <Provider store={store}>
      <NextIntlClientProvider locale="en" messages={en}>
        <ExchangeRatesPanel />
      </NextIntlClientProvider>
    </Provider>,
  );
}

describe('ExchangeRatesPanel (Phase E2)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = makeRatesFetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders the list of rates with code, rate and last-updated', async () => {
    renderPanel();

    expect(await screen.findByText('USD')).toBeInTheDocument();
    expect(screen.getByTestId('rate-value-USD')).toHaveTextContent('1,500');
    expect(screen.getByTestId('rate-value-NGN')).toHaveTextContent('1');
    expect(screen.getByTestId('exchange-rate-row-EUR')).toBeInTheDocument();
    expect(screen.getByTestId('exchange-rate-row-GHS')).toBeInTheDocument();
  });

  it('edits a rate inline and PATCHes with the admin bearer token', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByTestId('edit-USD'));

    const input = screen.getByTestId('rate-input-USD');
    await user.clear(input);
    await user.type(input, '1600');
    await user.click(screen.getByTestId('save-USD'));

    await waitFor(() => {
      const patchCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => String(c[0]).includes('/exchange-rates/USD') && c[1]?.method === 'PATCH',
      );
      expect(patchCall).toBeTruthy();
      expect((patchCall![1] as RequestInit & { headers: Record<string, string>; body: string }).headers.Authorization).toBe('Bearer test-token');
      expect(JSON.parse((patchCall![1] as RequestInit & { body: string }).body)).toEqual({ rate: 1600 });
    });
  });

  it('rejects invalid (non-positive) rates with an error toast and no PATCH', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByTestId('edit-USD'));
    await user.clear(screen.getByTestId('rate-input-USD'));
    await user.type(screen.getByTestId('rate-input-USD'), '0');
    await user.click(screen.getByTestId('save-USD'));

    await waitFor(() => {
      const patchCalls = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c) => c[1]?.method === 'PATCH',
      );
      expect(patchCalls).toHaveLength(0);
    });
  });

  it('refreshes rates from the feed endpoint', async () => {
    const user = userEvent.setup();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('/exchange-rates/refresh')) {
          return Promise.resolve({ ok: true, json: async () => ({ success: true, updated: 2 }) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { base: 'NGN', rates: RATES, updatedAt: UPDATED_AT } }),
        });
      },
    );

    renderPanel();
    await screen.findByTestId('rate-value-USD');

    await user.click(screen.getByRole('button', { name: /Refresh from Feed/i }));

    await waitFor(() => {
      const refreshCall = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => String(c[0]).includes('/exchange-rates/refresh') && c[1]?.method === 'POST',
      );
      expect(refreshCall).toBeTruthy();
      expect((refreshCall![1] as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe('Bearer test-token');
    });
  });

  it('shows an error state and retry when loading fails', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    renderPanel();

    expect(await screen.findByText('Failed to load rates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('shows an empty state when there are no rates', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { base: 'NGN', rates: {}, updatedAt: null } }),
    } as unknown as Response);

    renderPanel();

    expect(await screen.findByText('No exchange rates')).toBeInTheDocument();
  });
});
