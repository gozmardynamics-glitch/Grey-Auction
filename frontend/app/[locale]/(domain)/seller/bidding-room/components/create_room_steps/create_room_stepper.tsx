import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Room Details' },
  { number: 2, label: 'Auctions' },
  { number: 3, label: 'Review' },
] as const;

interface CreateRoomStepperProps {
  currentStep: number;
}

export default function CreateRoomStepper({
  currentStep,
}: CreateRoomStepperProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                currentStep >= step.number
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
