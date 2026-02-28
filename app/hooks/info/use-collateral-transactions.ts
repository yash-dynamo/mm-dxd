import { useCallback, useEffect, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { CollateralTransaction } from '@/types/trading';

interface UseCollateralTransactionsProps {
  refetch?: boolean;
  polling?: boolean;
  enabled?: boolean;
}

export function useCollateralTransactions({
  refetch = false,
  polling = false,
  enabled = true,
}: UseCollateralTransactionsProps = {}) {
  const { setCollateralTransactions } = useUserTradingDataStore();
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollateralTransactions = useCallback(async () => {
    try {

      console.log('fetchCollateralTransactions', polling, enabled, address, status);

      if (!polling) {
        setLoading(true);
        setError(null);
      }
      if (!enabled || !address || status === 'disconnected') {
        if (!polling) {
          setLoading(false);
        }
        return;
      }

      const collateralTransactions = await infoClient.getTransferHistory({
        user: address,
      });
      console.log('collateralTransactions', collateralTransactions);
      setCollateralTransactions(collateralTransactions as CollateralTransaction[]);
    } catch (err) {
      if (!polling) {
        setError('Failed to fetch collateral transactions');
      }
    } finally {
      if (!polling) {
        setLoading(false);
      }
    }
  }, [address, infoClient, setCollateralTransactions, polling, enabled, status]);

  // Initial fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchCollateralTransactions();
    }
  }, [fetchCollateralTransactions, enabled]);

  // Refetch when tab changes
  useEffect(() => {
    if (refetch && enabled) {
      fetchCollateralTransactions();
    }
  }, [refetch, enabled, fetchCollateralTransactions]);

  return {
    isLoading,
    error,
    fetchCollateralTransactions,
  };
}
