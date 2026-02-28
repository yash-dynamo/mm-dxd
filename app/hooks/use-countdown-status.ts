'use client';

import { useState, useEffect } from 'react';
import { env } from '@/config';

interface CountdownStatus {
  isActive: boolean;
  timeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  targetDate: Date;
}

function calculateStatus(targetDate: Date): CountdownStatus {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      isActive: false,
      timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0 },
      targetDate,
    };
  }

  return {
    isActive: true,
    timeLeft: {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    },
    targetDate,
  };
}

/**
 * Hook to track countdown status for mainnet access gating
 * Returns whether countdown is still active and time remaining
 */
export function useCountdownStatus(): CountdownStatus {
  const [targetDate] = useState(() => new Date(env.NEXT_PUBLIC_COUNTDOWN_END_DATE ?? '2099-01-01'));
  const [status, setStatus] = useState<CountdownStatus>(() => calculateStatus(targetDate));

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      const newStatus = calculateStatus(targetDate);
      setStatus(newStatus);

      // Clear interval once countdown is complete
      if (!newStatus.isActive) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return status;
}
