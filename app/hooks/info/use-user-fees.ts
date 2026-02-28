import { useEffect, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { UserFees } from '@/types/trading';
import { Address } from 'viem';
import { normalizeAddress } from '@/utils/formatting';

export function useUserFees() {
  const { isLoading, setLoading, setUserFees } = useUserTradingDataStore();
  const [error, setError] = useState<Error | null>(null);
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();

  const fetchUserFees = async (addr: Address) => {
    // Normalize address before API call to ensure checksummed format
    const normalizedAddr = normalizeAddress(addr);
    try {
      setLoading(true);
      setError(null);

      // Assuming the API has a userFees method - if not, we'll need to implement it
      const userFees = await infoClient.userFeeInfo({
        user: normalizedAddr,
      });

      setUserFees(userFees as UserFees);
    } catch (err) {
      console.error('Error fetching user fees:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user fees'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address && status !== 'disconnected') {
      fetchUserFees(address as Address);
    }
  }, [address, status]);

  return {
    isLoading: isLoading,
    error: error,
  };
}
