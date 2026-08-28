'use client';

import { useCurrency } from './currency-provider';

/** Renders an NGN amount in the user's selected currency (L2). */
export function Money({ amount }: { amount: number }) {
  const { format } = useCurrency();
  return <span data-testid="money">{format(amount)}</span>;
}

export default Money;
