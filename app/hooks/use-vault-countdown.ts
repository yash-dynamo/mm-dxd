'use client';

import { useState, useEffect } from 'react';
import { isMainnet } from '@/config/env';

// Vault opens Feb 10, 2026 09:00 EST (14:00 UTC)
export const VAULT_OPEN_DATE = new Date('2026-02-10T14:00:00Z');
// Vault closes 24 hours later - Feb 11, 2026 09:00 EST (14:00 UTC)
export const VAULT_CLOSE_DATE = new Date('2026-02-11T14:00:00Z');
// Withdrawals enabled 2 hours after vault opens - Feb 10, 2026 11:00 EST (16:00 UTC)
export const WITHDRAWAL_ENABLED_DATE = new Date('2026-02-10T16:00:00Z');

export type VaultPhase = 'before' | 'active' | 'after';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

interface VaultCountdownStatus {
  phase: VaultPhase;
  timeLeft: TimeLeft;
  formattedTime: string;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
  message: string;
}

function formatTimeLeft(timeLeft: TimeLeft): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;
}

function calculateStatus(): VaultCountdownStatus {
  const now = new Date();
  const openTime = VAULT_OPEN_DATE.getTime();
  const closeTime = VAULT_CLOSE_DATE.getTime();
  const withdrawalTime = WITHDRAWAL_ENABLED_DATE.getTime();
  const currentTime = now.getTime();

  // Withdrawal is enabled 2 hours after vault opens
  const isWithdrawalEnabled = currentTime >= withdrawalTime;

  // Before vault opens
  if (currentTime < openTime) {
    const difference = openTime - currentTime;
    const totalHours = Math.floor(difference / (1000 * 60 * 60));
    const timeLeft: TimeLeft = {
      hours: totalHours,
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
    return {
      phase: 'before',
      timeLeft,
      formattedTime: formatTimeLeft(timeLeft),
      isDepositEnabled: true,
      isWithdrawalEnabled,
      message: 'HLV Vault deposits open in',
    };
  }

  // Vault is active (within 24h window)
  if (currentTime >= openTime && currentTime < closeTime) {
    const difference = closeTime - currentTime;
    const totalHours = Math.floor(difference / (1000 * 60 * 60));
    const timeLeft: TimeLeft = {
      hours: totalHours,
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
    return {
      phase: 'active',
      timeLeft,
      formattedTime: formatTimeLeft(timeLeft),
      isDepositEnabled: true,
      isWithdrawalEnabled,
      message: 'HLV Vault deposits are live now -',
    };
  }

  // After vault closes
  return {
    phase: 'after',
    timeLeft: { hours: 0, minutes: 0, seconds: 0 },
    formattedTime: '00:00:00',
    isDepositEnabled: true,
    isWithdrawalEnabled,
    message: '',
  };
}

// Default state for testnet - everything normal (deposit & withdrawal enabled, no countdown UI)
const TESTNET_STATUS: VaultCountdownStatus = {
  phase: 'after',
  timeLeft: { hours: 0, minutes: 0, seconds: 0 },
  formattedTime: '00:00:00',
  isDepositEnabled: true,
  isWithdrawalEnabled: true,
  message: '',
};

/**
 * Hook to track vault deposit window countdown
 * Returns phase (before/active/after), time remaining, and deposit enabled state
 * On testnet: always returns normal state (deposit enabled, no countdown)
 */
export function useVaultCountdown(): VaultCountdownStatus {
  const [status, setStatus] = useState<VaultCountdownStatus>(() => 
    isMainnet ? calculateStatus() : TESTNET_STATUS
  );

  useEffect(() => {
    // On testnet, skip countdown logic entirely
    if (!isMainnet) {
      return;
    }

    // Update every second
    const timer = setInterval(() => {
      const newStatus = calculateStatus();
      setStatus(newStatus);

      // Clear interval once countdown is complete (after phase)
      if (newStatus.phase === 'after') {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return status;
}
