'use client';

import { Globe } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from './currency-provider';

/** Currency switcher (L2). Persists the choice and reformats prices app-wide. */
export function CurrencySelect() {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-input px-2 py-1.5" aria-label="Display currency">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        data-testid="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="bg-transparent text-sm outline-none"
        aria-label="Display currency"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

export default CurrencySelect;
