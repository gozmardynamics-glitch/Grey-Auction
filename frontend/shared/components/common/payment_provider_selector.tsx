'use client';

import { cn } from '@/lib/utils';
import { CreditCard, Landmark, Wallet, type LucideIcon } from 'lucide-react';

export type PaymentProviderId = 'paystack' | 'flutterwave' | 'interswitch' | 'opay';

const PROVIDERS: { id: PaymentProviderId; label: string; icon: LucideIcon; description: string }[] = [
  { id: 'paystack', label: 'Paystack', icon: CreditCard, description: 'Card, bank transfer, USSD' },
  { id: 'flutterwave', label: 'Flutterwave', icon: CreditCard, description: 'Card, transfer, mobile money' },
  { id: 'interswitch', label: 'Interswitch', icon: Landmark, description: 'Bank transfer / Collection' },
  { id: 'opay', label: 'OPay', icon: Wallet, description: 'OPay wallet & transfer' },
];

interface PaymentProviderSelectorProps {
  value?: PaymentProviderId;
  onChange: (provider: PaymentProviderId) => void;
  disabled?: boolean;
  columns?: 2 | 4;
}

/**
 * Lets the buyer pick their payment platform (Paystack / Flutterwave /
 * Interswitch / OPay). Used in checkout and wallet deposit.
 */
export function PaymentProviderSelector({
  value = 'paystack',
  onChange,
  disabled = false,
  columns = 4,
}: PaymentProviderSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Payment platform"
      className={cn('grid gap-2', columns === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}
    >
      {PROVIDERS.map((p) => {
        const Icon = p.icon;
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
              active
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted/40',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <Icon className="h-4 w-4" />
              {p.label}
            </span>
            <span className="text-xs text-muted-foreground">{p.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export default PaymentProviderSelector;
