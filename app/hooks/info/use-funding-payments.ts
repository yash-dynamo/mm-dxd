import { useCallback, useEffect, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { FundingPayment } from '@/types/trading';

interface UseFundingPaymentsProps {
  refetch?: boolean;
  polling?: boolean;
  enabled?: boolean;
}

export function useFundingPayments({
  refetch = false,
  polling = false,
  enabled = true,
}: UseFundingPaymentsProps = {}) {
  const { setFundingPayments, successTable } = useUserTradingDataStore();
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFundingPayments = useCallback(async () => {
    try {
      if (!polling) {
        setLoading(true);
      }
      if (!enabled || !address || status === 'disconnected') return;
      const fundingPayments:any = (await infoClient.fundingHistory({
        user: address,
        limit: 10,
      }));
      if (address) {
        setFundingPayments(fundingPayments.data as FundingPayment[]);
      } else {
        setFundingPayments(fundingPayments.data as FundingPayment[]);
      }
    } catch (err) {
      console.error('Error fetching funding payments:', err);
      if (!polling) {
        setError('Failed to fetch funding payments');
      }
    } finally {
      if (!polling) {
        setLoading(false);
      }
    }
  }, [address, infoClient, setFundingPayments, polling]);

  const hasSuccess = successTable.fundingPayments;

  useEffect(() => {
    if (!hasSuccess || refetch) {
      fetchFundingPayments();
    }
  }, [enabled, address, status, fetchFundingPayments, refetch, hasSuccess]);

  return {
    isLoading,
    error,
    fetchFundingPayments,
  };
}
