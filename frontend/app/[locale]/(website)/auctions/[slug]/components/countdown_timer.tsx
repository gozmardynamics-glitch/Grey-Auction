'use client';

import { useAppSelector } from '@/redux/store';

export default function CountdownTimer() {
  const timeLeft = useAppSelector((state) => state.bidding.timeLeft);
  const timeComponents = {
    days: Math.floor(timeLeft / (24 * 60 * 60)),
    hours: Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60)),
    mins: Math.floor((timeLeft % (60 * 60)) / 60),
    secs: timeLeft % 60,
  };

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">Time Left:</p>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[
          { value: timeComponents.days, label: 'Days' },
          { value: timeComponents.hours, label: 'Hours' },
          { value: timeComponents.mins, label: 'Mins' },
          { value: timeComponents.secs, label: 'Secs' },
        ].map((unit, idx) => (
          <div
            key={unit.label}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <div className="flex flex-col items-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border text-lg font-bold sm:h-14 sm:w-14 sm:text-xl">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                {unit.label}
              </span>
            </div>
            {idx < 3 && (
              <span className="mb-4 text-lg font-bold text-muted-foreground sm:text-xl">
                :
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Auction ends: January 7, 2026 12:00 PM WAT
      </p>
    </div>
  );
}
