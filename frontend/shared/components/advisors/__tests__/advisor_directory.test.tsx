import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvisorDirectory } from '../advisor_directory';

describe('AdvisorDirectory (L8)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'a1', name: 'Lagos Auto Advisory', type: 'advisor', specialty: 'Vehicles', city: 'Lagos', region: 'Lagos', country: 'Nigeria', phone: '080111' },
          { id: 'a2', name: 'Abuja Equipment Desk', type: 'dealer', city: 'Abuja', region: 'Abuja', country: 'Nigeria' },
        ],
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches and renders advisor cards', async () => {
    render(<AdvisorDirectory />);
    expect(await screen.findByText('Lagos Auto Advisory')).toBeInTheDocument();
    expect(screen.getByText('Abuja Equipment Desk')).toBeInTheDocument();
    expect(screen.getAllByTestId('advisor-card')).toHaveLength(2);
  });

  it('filters advisors by region', async () => {
    const user = userEvent.setup();
    render(<AdvisorDirectory />);
    await screen.findByText('Lagos Auto Advisory');

    await user.click(screen.getByRole('button', { name: 'Lagos' }));
    expect(screen.getByText('Lagos Auto Advisory')).toBeInTheDocument();
    expect(screen.queryByText('Abuja Equipment Desk')).not.toBeInTheDocument();
  });
});
