import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyProvider, useCurrency } from '../currency-provider';
import { CurrencySelect } from '../currency-select';
import { Money } from '../money';

function Probe() {
  const { currency, convert, format, setCurrency } = useCurrency();
  return (
    <div>
      <span data-testid="cur">{currency}</span>
      <span data-testid="conv">{convert(3000)}</span>
      <span data-testid="fmt">{format(1500)}</span>
      <button data-testid="switch" onClick={() => setCurrency('USD')}>
        Switch
      </button>
    </div>
  );
}

describe('Currency (L2)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { base: 'NGN', rates: { NGN: 1, USD: 1500, GHS: 85, EUR: 1650 } } }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('defaults to NGN and converts 1:1 before switching', async () => {
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );
    expect(screen.getByTestId('cur')).toHaveTextContent('NGN');
    expect(screen.getByTestId('conv')).toHaveTextContent('3000');
  });

  it('converts and formats in USD after switching', async () => {
    const user = userEvent.setup();
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );
    await user.click(screen.getByTestId('switch'));
    await waitFor(() => expect(screen.getByTestId('cur')).toHaveTextContent('USD'));
    expect(screen.getByTestId('conv')).toHaveTextContent('2');
    expect(screen.getByTestId('fmt')).toHaveTextContent('1.00');
  });

  it('persists the selected currency', async () => {
    const user = userEvent.setup();
    render(
      <CurrencyProvider>
        <Probe />
      </CurrencyProvider>,
    );
    await user.click(screen.getByTestId('switch'));
    await waitFor(() => expect(window.localStorage.getItem('greyauction:currency')).toBe('USD'));
  });

  it('renders Money in the selected currency', async () => {
    const user = userEvent.setup();
    render(
      <CurrencyProvider>
        <Probe />
        <Money amount={1500} />
      </CurrencyProvider>,
    );
    await user.click(screen.getByTestId('switch'));
    await waitFor(() => expect(screen.getAllByTestId('money')[0]).toHaveTextContent('1.00'));
  });

  it('exposes the four supported currencies in the selector', () => {
    render(
      <CurrencyProvider>
        <CurrencySelect />
      </CurrencyProvider>,
    );
    const select = screen.getByTestId('currency-select') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['NGN', 'USD', 'GHS', 'EUR']);
  });
});
