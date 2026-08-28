import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { KycBadge } from '../kyc_badge';

describe('KycBadge (L4)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch;
    vi.restoreAllMocks();
  });

  const stub = (badge: string) =>
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          sellerId: 's1',
          businessName: 'Acme',
          badge,
          verificationStatus: 'APPROVED',
          approvedDocuments: 2,
          rating: 4.5,
          totalSales: 9,
          memberSince: null,
        },
      }),
    });

  it('shows a neutral pill before the fetch resolves', () => {
    stub('verified');
    render(<KycBadge sellerId="s1" name="Acme" />);
    expect(screen.getByTestId('kyc-badge')).toBeInTheDocument();
  });

  it('renders the "Verified & Trusted" badge for trusted sellers', async () => {
    stub('trusted');
    render(<KycBadge sellerId="s1" />);
    expect(await screen.findByText('Verified & Trusted')).toBeInTheDocument();
  });

  it('renders the "Verified Seller" badge for verified sellers', async () => {
    stub('verified');
    render(<KycBadge sellerId="s1" />);
    expect(await screen.findByText('Verified Seller')).toBeInTheDocument();
  });

  it('renders the pending badge for sellers under review', async () => {
    stub('pending');
    render(<KycBadge sellerId="s1" />);
    expect(await screen.findByText('Verification Pending')).toBeInTheDocument();
  });

  it('does not fetch when no sellerId is supplied', () => {
    stub('verified');
    render(<KycBadge />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('survives a network error with the neutral pill', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    render(<KycBadge sellerId="s1" />);
    await waitFor(() => expect(screen.getByTestId('kyc-badge')).toBeInTheDocument());
  });
});
