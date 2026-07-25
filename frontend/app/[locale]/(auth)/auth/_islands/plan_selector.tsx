'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

interface PlanFeature {
  label: string;
}

interface Plan {
  name: string;
  subtitle: string;
  highlight: string;
  highlightUnit: string;
  features: PlanFeature[];
}

const PLANS: Plan[] = [
  {
    name: 'Free Plan',
    subtitle: 'Basic Auction Access',
    highlight: '25',
    highlightUnit: 'Trials',
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
    features: [
      { label: 'Unlimited active auction uploads' },
      { label: 'Standard bidding room access' },
      { label: 'Standard marketplace visibility' },
      { label: 'Advanced analytical dashboard' },
      { label: '3% commission on successful sales' },
    ],
  },
];

export default function PlanSelector() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPlanDetails(true);
  };

  const handleContinue = () => {
    setShowPlanDetails(false);
    setShowVerificationDialog(true);
  };

  return (
    <>
      {/* Back Button */}
      <Button
        variant="link"
        className="p-0 mb-6 text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="md:text-2xl text-lg font-bold text-foreground">
          Select Account Plan
        </h2>
        <p className="text-xs md:text-base text-muted-foreground">
          This will help us set up your account properly.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className="flex flex-col justify-between rounded-xl border p-5 space-y-5"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.highlight}</span>
                <span className="text-sm text-muted-foreground">
                  {plan.highlightUnit}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => handleSelectPlan(plan)}
              >
                Select Plan
              </Button>

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

      {/* Plan Details Confirmation Modal */}
      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="max-w-md p-0">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle>{selectedPlan?.name}</DialogTitle>
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

      {/* Verification Under Review Dialog */}
      <Dialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md text-center"
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <svg
                width="120"
                height="100"
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 35 L60 10 L110 35 L110 45 L10 45 Z"
                  fill="#E53E3E"
                />
                <path d="M10 45 Q22 55 35 45" fill="#E53E3E" />
                <path d="M35 45 Q47 55 60 45" fill="#FFFFFF" stroke="#E5E7EB" />
                <path d="M60 45 Q72 55 85 45" fill="#E53E3E" />
                <path
                  d="M85 45 Q97 55 110 45"
                  fill="#FFFFFF"
                  stroke="#E5E7EB"
                />
                <rect
                  x="15"
                  y="45"
                  width="90"
                  height="50"
                  rx="2"
                  fill="#FEF3C7"
                />
                <rect
                  x="45"
                  y="60"
                  width="30"
                  height="35"
                  rx="2"
                  fill="#92400E"
                />
                <circle cx="70" cy="80" r="2" fill="#FCD34D" />
                <rect
                  x="22"
                  y="55"
                  width="16"
                  height="14"
                  rx="1"
                  fill="#BFDBFE"
                />
                <rect
                  x="82"
                  y="55"
                  width="16"
                  height="14"
                  rx="1"
                  fill="#BFDBFE"
                />
                <line
                  x1="30"
                  y1="55"
                  x2="30"
                  y2="69"
                  stroke="#FCD34D"
                  strokeWidth="1"
                />
                <line
                  x1="22"
                  y1="62"
                  x2="38"
                  y2="62"
                  stroke="#FCD34D"
                  strokeWidth="1"
                />
                <line
                  x1="90"
                  y1="55"
                  x2="90"
                  y2="69"
                  stroke="#FCD34D"
                  strokeWidth="1"
                />
                <line
                  x1="82"
                  y1="62"
                  x2="98"
                  y2="62"
                  stroke="#FCD34D"
                  strokeWidth="1"
                />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8L6.5 11.5L13 5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                Verification under review
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We&apos;re reviewing your details. You can access your dashboard
                while we complete the process.
              </p>
            </div>

            <Button
              onClick={() => router.push('/seller/dashboard')}
              className="bg-primary hover:bg-primary-2 text-primary-foreground font-semibold px-8"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
