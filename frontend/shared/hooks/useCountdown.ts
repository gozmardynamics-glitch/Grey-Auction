'use client';

import { useState, useEffect } from 'react';
import { calculateTimeRemaining } from '@/shared/utils/helpers';

export function useCountdown(endTime?: Date | string) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const endTimeStr = endTime ? new Date(endTime).getTime().toString() : '';

  useEffect(() => {
    if (!endTimeStr) return;
    const end = new Date(Number(endTimeStr));
    const update = () => setTimeRemaining(calculateTimeRemaining(end));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  return timeRemaining;
}
