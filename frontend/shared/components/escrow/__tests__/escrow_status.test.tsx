import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EscrowStatus } from '../escrow_status';

describe('EscrowStatus (L5)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'h1', invoiceId: 'inv-1', amount: 100, status: 'held', releasedAt: null }] }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('renders nothing without an invoice id', () => {
    render(<EscrowStatus />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the hold status badge', async () => {
    render(<EscrowStatus invoiceId="inv-1" token="t" />);
    expect(await screen.findByTestId('escrow-status')).toHaveTextContent('held');
  });

  it('shows an empty state when there are no holds', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    render(<EscrowStatus invoiceId="inv-1" token="t" />);
    expect(await screen.findByText(/No escrow hold yet/)).toBeInTheDocument();
  });
});
