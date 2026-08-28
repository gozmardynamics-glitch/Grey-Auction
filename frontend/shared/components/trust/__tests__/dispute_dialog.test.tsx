import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisputeDialog, DISPUTE_REASONS } from '../dispute_dialog';

describe('DisputeDialog (L4)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('exposes the full reason catalogue', () => {
    expect(DISPUTE_REASONS.map((r) => r.value)).toEqual([
      'not_as_described',
      'non_delivery',
      'payment_issue',
      'conduct',
      'other',
    ]);
  });

  it('requires a description before submitting', async () => {
    const user = userEvent.setup();
    render(<DisputeDialog open onClose={() => {}} token="t" productId="p1" />);

    await user.click(screen.getByTestId('dispute-submit'));
    expect(await screen.findByText('Please describe the issue.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('posts a dispute with reason, description and productId', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DisputeDialog open onClose={onClose} token="t" productId="p1" productTitle="2022 Toyota Camry" />);

    await user.type(screen.getByTestId('dispute-description'), 'The lot differs from the photos.');
    await user.click(screen.getByTestId('dispute-submit'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/disputes');
    expect(opts.method).toBe('POST');
    expect(opts.headers.Authorization).toBe('Bearer t');
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({ reason: 'not_as_described', productId: 'p1', description: 'The lot differs from the photos.' });
    expect(onClose).toHaveBeenCalled();
  });
});
