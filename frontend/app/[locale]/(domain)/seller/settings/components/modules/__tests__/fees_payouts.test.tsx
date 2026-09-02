import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from '@/redux/store';
import { setUser } from '@/app/[locale]/(auth)/slices/auth.slice';
import FeesPayoutsSettings from '../fees_payouts';

function renderModule() {
  const store = makeStore();
  store.dispatch(
    setUser({
      user: { id: 'u1', name: 'Seller', email: 'demo@seller.com', role: 'seller' },
      token: 'test-token',
    }),
  );
  return render(
    <Provider store={store}>
      <FeesPayoutsSettings />
    </Provider>,
  );
}

function makeFetch() {
  return vi.fn((url: any) => {
    const u = String(url);
    if (u.includes('/sellers/settings/fees')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            scope: 'seller',
            scopeId: 'u1',
            buyerFeePct: '5.00',
            buyerFeeEnabled: true,
            sellerFeePct: '5.00',
            sellerFeeEnabled: false,
            vatPct: null,
            vatBase: 'fees_only',
          },
        }),
      });
    }
    if (u.includes('/sellers/profile/me')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: { payout_frequency: 'daily' } }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ success: true, data: {} }) });
  }) as unknown as typeof fetch;
}

describe('FeesPayoutsSettings (U5)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = makeFetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('loads the seller override + payout frequency', async () => {
    renderModule();

    // override values populate the inputs (backend decimals arrive as '5.00')
    const feeInputs = await screen.findAllByDisplayValue('5.00');
    expect(feeInputs).toHaveLength(2); // buyer fee + seller commission
    // payout select shows the stored frequency via the badge
    expect(await screen.findByText(/current: daily/i)).toBeInTheDocument();
  });

  it('saves fee preferences with the bearer token and null-inherit fields', async () => {
    const user = userEvent.setup();
    renderModule();
    await screen.findAllByDisplayValue('5.00');

    await user.click(screen.getByRole('button', { name: /save fee preferences/i }));

    await waitFor(() => {
      const put = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => String(c[0]).includes('/sellers/settings/fees') && c[1]?.method === 'PUT',
      );
      expect(put).toBeTruthy();
      const init = put![1] as RequestInit & { headers: Record<string, string>; body: string };
      expect(init.headers.Authorization).toBe('Bearer test-token');
      const body = JSON.parse(init.body);
      expect(body.sellerFeeEnabled).toBe(false);
      expect(body.vatPct).toBeNull(); // empty input -> null (inherit)
      expect(body.vatBase).toBe('fees_only');
    });
  });

  it('saves the payout schedule', async () => {
    const user = userEvent.setup();
    renderModule();
    await screen.findByText(/current: daily/i);

    await user.click(screen.getByRole('button', { name: /save payout schedule/i }));

    await waitFor(() => {
      const patch = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => String(c[0]).includes('/sellers/settings/payout-frequency') && c[1]?.method === 'PATCH',
      );
      expect(patch).toBeTruthy();
      expect(JSON.parse((patch![1] as any).body)).toEqual({ frequency: 'daily' });
    });
  });
});