'use client';

import { useCountdown } from '@/shared/hooks/useCountdown';
import { Card } from '@/shared/components/common';

export function CountdownTimer({ endTime }: { endTime: string }) {
  const time = useCountdown(new Date(endTime));

  const units = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Mins' },
    { value: time.seconds, label: 'Secs' },
  ];

  return (
    <Card className="flex gap-3 w-fit items-center rounded-md px-4 py-2">
      {units.map((u, i) => (
        <div key={u.label} className={`flex items-center gap-3`}>
          <div className="text-center flex items-center gap-2">
            <span className="text-xl md:text-2xl font-bold text-foreground tabular-nums">
              {String(u.value).padStart(2, '0')}
            </span>
            <p className="text-sm text-muted-foreground uppercase mt-1">
              {u.label}
            </p>
            {i < units.length - 1 && (
              <span className="text-2xl md:text-3xl font-bold text-muted-foreground">
                :
              </span>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
