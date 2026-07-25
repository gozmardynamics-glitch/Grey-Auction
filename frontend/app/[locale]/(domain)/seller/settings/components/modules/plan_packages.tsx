'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';
import { cn } from '@/lib/utils';

interface PlanFeature {
  label: string;
}

interface Plan {
  name: string;
  subtitle: string;
  highlight: string;
  highlightUnit: string;
  isCurrent: boolean;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    name: 'Free Plan',
    subtitle: 'Basic Auction Access',
    highlight: '25',
    highlightUnit: 'Trials',
    isCurrent: true,
    features: [
      { label: 'Limited active auction uploads' },
      { label: 'Standard bidding room access' },
      { label: 'Standard marketplace visibility' },
      { label: 'Advanced analytical dashboard' },
      { label: '8% commission on successful sales' },
    ],
  },
  {
    name: 'Premium Plan',
    subtitle: 'Pay per Auction',
    highlight: '2%',
    highlightUnit: '/Auction Upload',
    isCurrent: false,
    features: [
      { label: 'Unlimited active auction uploads' },
      { label: 'Standard bidding room access' },
      { label: 'Standard marketplace visibility' },
      { label: 'Advanced analytical dashboard' },
      { label: '2% per auction upload' },
      { label: '1% commission on successful sales' },
    ],
  },
  {
    name: 'Pro Plan',
    subtitle: 'Unlimited Auction',
    highlight: '3%',
    highlightUnit: 'Commission',
    isCurrent: false,
    features: [
      { label: 'Unlimited active auction uploads' },
      { label: 'Standard bidding room access' },
      { label: 'Standard marketplace visibility' },
      { label: 'Advanced analytical dashboard' },
      { label: '3% commission on successful sales' },
    ],
  },
];

export default function PlanPackages() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpgradeClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpgrade(true);
  };

  const handleContinue = () => {
    setShowUpgrade(false);
    setShowSuccess(true);
  };

  const handleDone = () => {
    setShowSuccess(false);
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              'flex flex-col justify-between rounded-xl border p-5 space-y-5',
              plan.isCurrent && 'border-primary/30'
            )}
          >
            <div className="space-y-4">
              {/* Plan header */}
              <div>
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
              </div>

              {/* Highlight */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.highlight}</span>
                <span className="text-sm text-muted-foreground">
                  {plan.highlightUnit}
                </span>
              </div>

              {/* CTA */}
              {plan.isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgradeClick(plan)}
                >
                  Upgrade
                </Button>
              )}

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Upgrade Confirmation Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="max-w-md p-0">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              This plan include:
            </p>

            {selectedPlan && (
              <div className="rounded-lg border p-4">
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleContinue}>Continue</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm p-0">
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            {/* Green checkmark with confetti */}
            <div className="flex h-24 w-24 items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Confetti dots */}
                <circle cx="20" cy="25" r="3" fill="#F59E0B" />
                <circle cx="80" cy="20" r="2.5" fill="#3B82F6" />
                <circle cx="15" cy="55" r="2" fill="#10B981" />
                <circle cx="85" cy="50" r="3" fill="#EF4444" />
                <circle cx="25" cy="75" r="2.5" fill="#8B5CF6" />
                <circle cx="75" cy="78" r="2" fill="#F59E0B" />
                <circle cx="35" cy="15" r="2" fill="#EC4899" />
                <circle cx="65" cy="12" r="2.5" fill="#10B981" />
                <circle cx="12" cy="40" r="2" fill="#3B82F6" />
                <circle cx="88" cy="35" r="2" fill="#EC4899" />
                {/* Confetti rectangles */}
                <rect x="28" y="85" width="5" height="2.5" rx="1" fill="#3B82F6" transform="rotate(-20 28 85)" />
                <rect x="70" y="88" width="5" height="2.5" rx="1" fill="#10B981" transform="rotate(15 70 88)" />
                <rect x="90" y="65" width="4" height="2" rx="1" fill="#F59E0B" transform="rotate(-30 90 65)" />
                {/* Green circle background */}
                <circle cx="50" cy="50" r="28" fill="#10B981" />
                {/* White checkmark */}
                <path
                  d="M38 50 L46 58 L62 42"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Upgrade Successful</h3>
              <p className="text-sm text-muted-foreground">
                You are now on the {selectedPlan?.name}.
              </p>
              <p className="text-sm text-muted-foreground">
                Your new commission rate will apply to future sales.
              </p>
            </div>

            <div className="flex justify-end w-full pt-2">
              <Button onClick={handleDone}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
