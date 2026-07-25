import { Check, X } from 'lucide-react';
import type { PaymentStatus, TransactionType } from '../../models';
import { formatCurrency } from '@/shared/utils/helpers';

interface TimelineStep {
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

function getTimelineSteps(
  paymentStatus: PaymentStatus,
  transactionType: TransactionType,
  amount: number,
  date: string
): TimelineStep[] {
  const isWithdraw = transactionType === 'Withdraw';
  const formattedAmount = formatCurrency(amount);

  const steps: TimelineStep[] = [
    {
      title: 'Transaction Initiated',
      description: `Payment of ${formattedAmount} was initiated`,
      date,
      status: 'completed',
    },
    {
      title: 'Authorization Request',
      description: 'Sent to payment processor for authorization',
      date,
      status: 'completed',
    },
  ];

  if (paymentStatus === 'Completed') {
    steps.push(
      {
        title: 'Authorization Approved',
        description: isWithdraw
          ? 'Payment approved by admin'
          : 'Payment approved by issuing bank',
        date,
        status: 'completed',
      },
      {
        title: 'Settlement Complete',
        description: isWithdraw
          ? 'Funds withdrawal successful'
          : 'Funds transferred successfully',
        date,
        status: 'completed',
      }
    );
  } else if (paymentStatus === 'Failed') {
    steps.push(
      {
        title: 'Authorization Pending',
        description: 'Payment approval is under review',
        date,
        status: 'pending',
      },
      {
        title: 'Settlement Failed',
        description: isWithdraw
          ? 'Funds withdrawal rejected'
          : 'Funds transferred rejected',
        date,
        status: 'failed',
      }
    );
  } else if (paymentStatus === 'Pending') {
    steps.push(
      {
        title: 'Authorization Pending',
        description: 'Payment approval is under review',
        date,
        status: 'pending',
      },
      {
        title: 'Settlement Pending',
        description: isWithdraw
          ? 'Funds approval is under review'
          : 'Payment approval is under review',
        date,
        status: 'pending',
      }
    );
  } else {
    // Refunded — show as completed flow
    steps.push(
      {
        title: 'Authorization Approved',
        description: 'Payment approved by admin',
        date,
        status: 'completed',
      },
      {
        title: 'Settlement Complete',
        description: 'Funds transferred successfully',
        date,
        status: 'completed',
      }
    );
  }

  return steps;
}

const stepConfig = {
  completed: {
    bg: 'bg-green-500',
    ring: 'ring-green-500/20',
    line: 'bg-green-500',
  },
  pending: {
    bg: 'bg-amber-500',
    ring: 'ring-amber-500/20',
    line: 'bg-border',
  },
  failed: {
    bg: 'bg-red-500',
    ring: 'ring-red-500/20',
    line: 'bg-border',
  },
};

function StepIcon({ status }: { status: TimelineStep['status'] }) {
  if (status === 'completed') {
    return <Check className="h-3 w-3 text-primary-foreground" />;
  }
  if (status === 'failed') {
    return <X className="h-3 w-3 text-primary-foreground" />;
  }
  return <div className="h-2 w-2 rounded-full bg-white" />;
}

interface TransactionTimelineProps {
  paymentStatus: PaymentStatus;
  transactionType: TransactionType;
  amount: number;
  date: string;
}

export default function TransactionTimeline({
  paymentStatus,
  transactionType,
  amount,
  date,
}: TransactionTimelineProps) {
  const steps = getTimelineSteps(paymentStatus, transactionType, amount, date);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Timeline</h3>
      <div className="relative">
        {steps.map((step, i) => {
          const config = stepConfig[step.status];
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[11px] top-7 h-[calc(100%-12px)] w-0.5 ${
                    stepConfig[
                      steps[i + 1].status === 'completed'
                        ? 'completed'
                        : 'pending'
                    ].line
                  }`}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ${config.bg} ${config.ring}`}
              >
                <StepIcon status={step.status} />
              </div>

              {/* Content */}
              <div className="flex flex-1 items-start justify-between gap-2 pt-0.5">
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {step.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
