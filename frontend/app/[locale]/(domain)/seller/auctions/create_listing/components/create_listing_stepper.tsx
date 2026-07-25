'use client';

import { cn } from '@/lib/utils';
import { STEPS } from '../../../models';

interface CreateListingStepperProps {
  currentStep: number;
}

export default function CreateListingStepper({
  currentStep,
}: CreateListingStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step circle + label */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                currentStep === step.number
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden sm:flex',
                currentStep === step.number
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                'mx-4 h-[2px] w-16 lg:w-24',
                currentStep > step.number
                  ? 'bg-background'
                  : 'border-t-2 border-dashed border-muted-foreground'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
