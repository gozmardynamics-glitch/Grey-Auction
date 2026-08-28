'use client';

import { useState } from 'react';
import { Truck } from 'lucide-react';
import { Button, Card, Input, Label } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Quote {
  method: string;
  cost: number;
  currency: string;
  weightKg: number;
  breakdown: { label: string; amount: number }[];
}

/**
 * Delivery cost estimator (L5). Calls the key-free tiered calculator at
 * POST /shipping/rates and shows the quote with its breakdown.
 */
export function RateEstimator() {
  const [method, setMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [city, setCity] = useState('Lagos');
  const [weight, setWeight] = useState('0');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');

  const estimate = async () => {
    setError('');
    try {
      const res = await fetch(API_BASE + '/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, city, weightKg: Number(weight) || 0 }),
      });
      if (!res.ok) {
        setError('Could not get a quote.');
        return;
      }
      const json = await res.json();
      setQuote(json.data);
    } catch {
      setError('Network error.');
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Delivery cost estimate</h4>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label htmlFor="rate-method">Method</Label>
          <select
            id="rate-method"
            data-testid="rate-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as 'pickup' | 'delivery')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="delivery">Home delivery</option>
            <option value="pickup">Pickup point</option>
          </select>
        </div>
        <div>
          <Label htmlFor="rate-city">City</Label>
          <Input id="rate-city" data-testid="rate-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rate-weight">Weight (kg)</Label>
          <Input id="rate-weight" data-testid="rate-weight" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>

      <Button size="sm" onClick={estimate} data-testid="rate-submit">Get quote</Button>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {quote && (
        <div data-testid="rate-quote" className="rounded-md bg-muted/40 p-3">
          <p className="text-sm font-semibold">
            {formatCurrency(quote.cost)} <span className="text-xs font-normal text-muted-foreground">{quote.currency}</span>
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {quote.breakdown.map((b) => (
              <li key={b.label}>{b.label}: {b.amount === 0 ? 'Free' : formatCurrency(b.amount)}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default RateEstimator;
