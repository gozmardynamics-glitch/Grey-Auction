'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GHS', 'EUR'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

const STORAGE_KEY = 'greyauction:currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<string, number>;
  convert: (amountNgn: number) => number;
  format: (amountNgn: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function currencyFormat(code: string): Intl.NumberFormat | null {
  const fractionDigits = code === 'NGN' ? 0 : 2;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  } catch {
    return null;
  }
}

/**
 * Currency provider (L2). Loads exchange rates from /exchange-rates and
 * converts NGN amounts into the selected display currency. Defaults to NGN.
 */
export function CurrencyProvider({ children }: { children?: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (SUPPORTED_CURRENCIES as readonly string[]).includes(saved)) {
        return saved as CurrencyCode;
      }
    } catch {
      // private mode
    }
    return 'NGN';
  });
  const [rates, setRates] = useState<Record<string, number>>({ NGN: 1 });

  useEffect(() => {
    fetch(API_BASE + '/exchange-rates', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && j.data && j.data.rates) setRates(j.data.rates);
      })
      .catch(() => undefined);
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* private mode */
    }
  }, []);

  const convert = useCallback(
    (amountNgn: number) => {
      const rate = rates[currency] || 1;
      return Math.round((amountNgn / rate) * 100) / 100;
    },
    [currency, rates],
  );

  const format = useCallback(
    (amountNgn: number) => {
      const converted = convert(amountNgn);
      const fmt = currencyFormat(currency);
      if (fmt) return fmt.format(converted);
      return currency + ' ' + converted.toLocaleString();
    },
    [convert, currency],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, rates, convert, format }),
    [currency, setCurrency, rates, convert, format],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export default CurrencyProvider;
