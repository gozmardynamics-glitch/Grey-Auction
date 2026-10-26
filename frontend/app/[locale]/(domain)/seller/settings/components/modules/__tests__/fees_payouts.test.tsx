import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeesPayoutsSettings from '../fees_payouts';

/**
 * `apiFetch` reads the raw text of the response, so these stubs implement the
 * slice of the Response contract it actually touches.
 */
function jsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

function makeFetch() {
  return vi.fn((url: any) => {
    const u = String(url);
    if (u.includes('/sellers/settings/fees')) {
      return Promise.resolve(
        jsonResponse({
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
      );
    }
    if (u.includes('/sellers/profile/me')) {
      return Promise.resolve(
        jsonResponse({ success: true, data: { payout_frequency: 'daily' } }),
      );
    }
    return Promise.resolve(jsonResponse({ success: true, data: {} }));
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
    render(<FeesPayoutsSettings />);

    // Admin-controlled rates are rendered read-only (backend decimals arrive as '5.00')
    const feeInputs = await screen.findAllByDisplayValue('5.00');
    expect(feeInputs).toHaveLength(2); // buyer fee + seller commission
    feeInputs.forEach((input) => expect(input).toHaveAttribute('readonly'));
    // VAT base comes from the platform, shown as text
    expect(await screen.findByText(/fees only/i)).toBeInTheDocument();
    // payout select shows the stored frequency via the badge
    expect(await screen.findByText(/current: daily/i)).toBeInTheDocument();
  });

  it('saves only the two fee toggles (percentages are admin-fixed)', async () => {
    const user = userEvent.setup();
    render(<FeesPayoutsSettings />);
    await screen.findAllByDisplayValue('5.00');

    await user.click(screen.getByRole('button', { name: /save fee preferences/i }));

    await waitFor(() => {
      const put = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
        (c) => String(c[0]).includes('/sellers/settings/fees') && c[1]?.method === 'PUT',
      );
      expect(put).toBeTruthy();
      const init = put![1] as RequestInit & { headers: Record<string, string>; body: string };
      // Auth rides on the session cookie through the same-origin proxy; sending
      // buyerFeePct/sellerFeePct/vatPct/vatBase would be rejected with a 400.
      expect(init.headers.Authorization).toBeUndefined();
      expect(JSON.parse(init.body)).toEqual({
        buyerFeeEnabled: true,
        sellerFeeEnabled: false,
      });
    });
  });

  it('saves the payout schedule', async () => {
    const user = userEvent.setup();
    render(<FeesPayoutsSettings />);
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
