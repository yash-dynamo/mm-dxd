import { useEffect } from 'react';
import { useInfoClient } from './use-info-client';
import { useAccountHistoryStore, useAuthStore } from '@/stores';
import { AccountHistory } from '@/types/trading';
import { normalizeAddress } from '@/utils/formatting';
import { Address } from 'viem';

export function useAccountHistory() {
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const { setAccountHistory } = useAccountHistoryStore();

  useEffect(() => {
    const fetchAccountHistory = async (addr: string) => {
      // Normalize address before API call to ensure checksummed format
      const normalizedAddr = normalizeAddress(addr as Address);
      try {
        const res = (await infoClient.accountHistory({
          user: normalizedAddr,
        })) as unknown as AccountHistory[];

        if (Array.isArray(res)) {
          setAccountHistory(normalizedAddr, res);
        }
      } catch (e) {
        console.error('accountHistory fetch failed', e);
      }
    };
    if (address && status !== 'disconnected') {
      fetchAccountHistory(address);
    }
  }, [address, status, infoClient, setAccountHistory]);
}
