import { useCallback, useEffect, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore, useVaultsStore } from '@/stores';
import { OrderHistory } from '@/types/trading';

interface UseOrderHistoryProps {
  vaultAddress?: string;
  refetch?: boolean;
  polling?: boolean;
  enabled?: boolean;
}

export function useOrderHistory({
  vaultAddress,
  refetch = false,
  polling = false,
  enabled = true,
}: UseOrderHistoryProps = {}) {
  const { setOrderHistory, successTable } = useUserTradingDataStore();
  const { setVaultOrderHistory } = useVaultsStore();
  // Use reactive selectors instead of getters
  const vaults = useVaultsStore((state) => state.vaults);
  const subVaults = useVaultsStore((state) => state.subVaults);
  const loadingTable = useVaultsStore((state) => state.loadingTable);
  const successTableVaults = useVaultsStore((state) => state.successTable);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();

  const fetchSubVaultOrderHistory = useCallback(
    async (vaultAddr: string, subVaultAddress: string, allOrderHistory: OrderHistory[]) => {
      try {
        const orderHistory: any = await infoClient.orderHistory({
          user: subVaultAddress,
          limit: 10,
        });
        allOrderHistory.push(...(orderHistory.data as OrderHistory[]));

        setVaultOrderHistory(vaultAddr, [...allOrderHistory]);
      } catch (err) {
        console.error('Error fetching order history for sub-vault:', subVaultAddress, err);
      }
    },
    [infoClient, setVaultOrderHistory],
  );

  const fetchOrderHistory = useCallback(async () => {
    try {
      if (!polling) {
        setLoading(true);
        setError(null);
      }

      if (!enabled || !address || status === 'disconnected') return;

      if (vaultAddress) {
        const subVaultAddresses =
          subVaults[vaultAddress]?.map((subVault) => subVault.sub_vault_address) || [];
        const allOrderHistory: OrderHistory[] = [];

        await Promise.all(
          subVaultAddresses.map((subVaultAddress) =>
            fetchSubVaultOrderHistory(vaultAddress, subVaultAddress, allOrderHistory),
          ),
        );
      } else {
        const orderHistory: any = await infoClient.orderHistory({
          user: address,
          limit: 10,
        });
        setOrderHistory(orderHistory.data as OrderHistory[]);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      if (!polling) {
        setError('Failed to fetch order history');
      }
    } finally {
      if (!polling) {
        setLoading(false);
      }
    }
  }, [
    address,
    vaultAddress,
    subVaults,
    fetchSubVaultOrderHistory,
    infoClient,
    setOrderHistory,
    polling,
  ]);

  const hasSuccess = vaultAddress
    ? successTableVaults[vaultAddress]?.orderHistory
    : successTable.orderHistory;

  useEffect(() => {
    if (!hasSuccess || refetch) {
      fetchOrderHistory();
    }
  }, [enabled, address, status, fetchOrderHistory, refetch, vaultAddress, hasSuccess]);

  return {
    isLoading,
    error,
    fetchOrderHistory,
  };
}
