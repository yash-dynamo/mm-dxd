'use client';

import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { FC, useEffect } from 'react';
import { useAccountSummary, useReferralSummary, useUserMetadata, useUserFees } from '@/hooks/info';

export const UserTradingDataProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, status } = useAuthStore();

  const { clearUserTradingData } = useUserTradingDataStore();

  useAccountSummary();
  useReferralSummary();
  useUserFees();

  useEffect(() => {
    if (status === 'disconnected' && address === '0x0000000000000000000000000000000000000000') {
      clearUserTradingData();
    }
  }, [status, address, clearUserTradingData]);

  return <>{children}</>;
};
