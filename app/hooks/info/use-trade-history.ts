import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfoClient } from './use-info-client';
import {
  useAuthStore,
  useGlobalStore,
  useNotificationStore,
  useUserTradingDataStore,
  useVaultsStore,
} from '@/stores';
import { Fill, TradeHistory } from '@/types/trading';
import { useSubscriptionClient } from './use-subscription-client';
import { Address } from 'viem';
import { getSubVaultAdresses } from '@/utils/global';
interface UseTradeHistoryProps {
  vaultAddress?: string;
  refetch?: boolean;
  polling?: boolean;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export function useTradeHistory({
  vaultAddress,
  refetch = false,
  polling = false,
  enabled = true,
  page = 0,
  limit = 10,
}: UseTradeHistoryProps = {}) {
  const { setNotification } = useNotificationStore();
  const { subscriptionClient } = useSubscriptionClient();
  const { setTradeHistory, successTable, updateTradeHistory } = useUserTradingDataStore();
  const { setVaultTradeHistory, updateVaultTradeHistory } = useVaultsStore();
  // Use reactive selectors instead of getters
  const vaults = useVaultsStore((state) => state.vaults);
  const subVaults = useVaultsStore((state) => state.subVaults);
  const successTableVaults = useVaultsStore((state) => state.successTable);
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const fillsSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const enableFillNotifications = useGlobalStore((state) => state.enableFillNotifications);

  const fetchSubVaultTradeHistory = useCallback(
    async (vaultAddr: string, subVaultAddress: string, allTradeHistory: TradeHistory[]) => {
      try {
        const tradeHistory: any = await infoClient.tradeHistory({
          user: subVaultAddress,
          limit: 10,
        });
        allTradeHistory.push(...(tradeHistory.data as TradeHistory[]));
        setVaultTradeHistory(vaultAddr, [...allTradeHistory]);
      } catch (err) {
        console.error('Error fetching trade history for sub-vault:', subVaultAddress, err);
      }
    },
    [infoClient],
  );

  const fetchTradeHistory = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!polling) {
        setLoading(true);
        setError(null);
      }

      if (!enabled || !address || status === 'disconnected') {
        isFetchingRef.current = false;
        return;
      }

      if (vaultAddress) {
        const subVaultAddresses = getSubVaultAdresses(
          subVaults[vaultAddress]?.map((subVault) => subVault.sub_vault_address) || [],
        );
        const allTradeHistory: TradeHistory[] = [];

        await Promise.all(
          subVaultAddresses.map((subVaultAddress) =>
            fetchSubVaultTradeHistory(vaultAddress, subVaultAddress, allTradeHistory),
          ),
        );
      } else {
        const tradeHistory: any = await infoClient.tradeHistory({
          user: address,
          limit,
          page,
        });
        setTradeHistory((tradeHistory.data as TradeHistory[]).reverse());
      }
    } catch (err) {
      console.error('Error fetching trade history:', err);
      if (!polling) {
        setError('Failed to fetch trade history');
      }
    } finally {
      isFetchingRef.current = false;
      if (!polling) {
        setLoading(false);
      }
    }
  }, [
    address,
    vaultAddress,
    subVaults,
    fetchSubVaultTradeHistory,
    infoClient,
    polling,
    enabled,
    status,
    page,
    limit,
  ]);

  const handleFillUpdate: (event: CustomEvent<Fill>) => void = (event: CustomEvent<Fill>) => {
    const updatedFills = event.detail;
    const currentPendingStatusOrders = useUserTradingDataStore.getState().pendingStatusOrders;
    if (
      enableFillNotifications &&
      !vaultAddress &&
      !currentPendingStatusOrders.includes(updatedFills.cloid)
    ) {
      setNotification({
        id: updatedFills.trade_id.toString(),
        title: 'Fill',
        message: `Fill ${updatedFills.instrument} ${updatedFills.size} at ${updatedFills.price}`,
        type: 'success',
      });
    }
    if (vaultAddress) {
      // updateVaultTradeHistory(vaultAddress, updatedFills);
    } else { //to use store and merge into one trade history, rather than refetch all trade history
      updateTradeHistory({ ...updatedFills, start_price: updatedFills.price, start_size: updatedFills.size });
    }
  };

  const hasSuccess = vaultAddress
    ? successTableVaults[vaultAddress]?.tradeHistory
    : successTable.tradeHistory;

  const setup = async (addr: Address) => {
    await fetchTradeHistory();
    await subscribeToFills(addr);
  };

  const cleanup = () => {
    if (fillsSubscriptionRef.current) {
      fillsSubscriptionRef.current.unsubscribe();
      fillsSubscriptionRef.current = null;
    }
  };

  const subscribeToFills = async (addr: Address) => {
    try {
      if (fillsSubscriptionRef.current) {
        fillsSubscriptionRef.current.unsubscribe();
      }

      fillsSubscriptionRef.current = await subscriptionClient.fills(
        {
          address: vaultAddress ? vaultAddress : addr,
        },
        handleFillUpdate,
      );
    } catch (err) {
      console.error('Error subscribing to fills:', err);
    }
  };

  useEffect(() => {
    if (address && address !== '0x0000000000000000000000000000000000000000') {
      setup(address);
    }

    return () => {
      cleanup();
    };
  }, [address]);

  return {
    isLoading,
    error,
    fetchTradeHistory,
    enableFillNotifications,
  };
}
