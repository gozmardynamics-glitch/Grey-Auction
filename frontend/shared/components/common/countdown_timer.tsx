'use client';

import { useState, useEffect } from 'react';
import { calculateTimeRemaining } from '@/shared/utils/helpers';

interface CountdownTimerProps {
  endTime: string | Date;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { digit: 'text-[8px]', sep: 'text-[8px]', gap: 'gap-1' },
  md: { digit: 'text-lg font-bold sm:text-xl', sep: 'text-lg sm:text-xl', gap: 'gap-1.5 sm:gap-2' },
  lg: { digit: 'text-2xl font-bold md:text-3xl', sep: 'text-2xl md:text-3xl', gap: 'gap-2 md:gap-3' },
} as const;

// SSR-safe initial state: a stable placeholder that matches on both server
// and client so the hydration tree never diverges. The real countdown kicks
// in once useEffect fires on the client.
const SSR_PLACEHOLDER = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function CountdownTimer({ endTime, size = 'md', className = '' }: CountdownTimerProps) {
  const [time, setTime] = useState(SSR_PLACEHOLDER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const end = new Date(endTime);
    const update = () => setTime(calculateTimeRemaining(end));
    update();
    setMounted(true);
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  // While SSR placeholder is active (before useEffect), render a stable
  // skeleton that matches the server output exactly — no hydration mismatch.
  if (!mounted) {
    const s = sizeMap[size];
    return (
      <span className={`inline-flex items-center ${s.gap} ${s.digit} text-muted-foreground font-medium ${className}`}>
        --:--
      </span>
    );
  }

  const expired = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;

  if (expired) {
    const s = sizeMap[size];
    return (
      <span className={`inline-flex items-center ${s.gap} ${s.digit} text-muted-foreground font-medium ${className}`}>
        Auction Ended
      </span>
    );
  }

  const hasDays = time.days > 0;
  const totalHours = time.days * 24 + time.hours;
  const showHours = totalHours >= 1;
  const isUrgent = time.days === 0 && time.hours === 0;

  const s = sizeMap[size];

  const digitClass = `tabular-nums font-bold ${s.digit} ${isUrgent ? 'text-red-500 animate-pulse' : 'text-foreground'}`;
  const sepClass = `font-bold ${s.sep} text-muted-foreground`;

  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {hasDays && (
        <>
          <span className={digitClass}>{String(time.days).padStart(2, '0')}</span>
          <span className={sepClass}>:</span>
        </>
      )}
      {showHours && (
        <>
          <span className={digitClass}>{String(time.hours).padStart(2, '0')}</span>
          <span className={sepClass}>:</span>
        </>
      )}
      <span className={digitClass}>{String(time.minutes).padStart(2, '0')}</span>
      <span className={sepClass}>:</span>
      <span className={digitClass}>{String(time.seconds).padStart(2, '0')}</span>
    </span>
  );
}
