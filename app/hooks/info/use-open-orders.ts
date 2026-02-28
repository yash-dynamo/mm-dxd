import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore, useVaultsStore } from '@/stores';
import { Order } from '@/types/trading';
import { useSubscriptionClient } from './use-subscription-client';
import { useShallow } from 'zustand/react/shallow';

interface UseOpenOrdersProps {
  vaultAddress?: string;
  enabled?: boolean;
}

export function useOpenOrders({ vaultAddress, enabled = true }: UseOpenOrdersProps = {}) {
  const { infoClient } = useInfoClient();
  const { setOpenOrders, updateOpenOrders } = useUserTradingDataStore();
  const { setVaultOpenOrders, updateVaultOpenOrders } = useVaultsStore();
  const subVaults = useVaultsStore(
    useShallow((state) => (vaultAddress ? (state.subVaults[vaultAddress] ?? []) : [])),
  );
  const subVaultAddresses = useMemo(
    () =>
      subVaults
        .map((subVault) => subVault.sub_vault_address)
        .filter((address): address is string => Boolean(address)),
    [subVaults],
  );
  const { subscriptionClient } = useSubscriptionClient();
  const { address, status } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  const fetchAndSubscribeToSubVault = useCallback(
    async (
      vaultAddr: string,
      subVaultAddress: string,
      allOrders: Order[],
      subscriptions: { unsubscribe: () => void }[],
    ) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: any = await infoClient.openOrders({
          user: subVaultAddress,
        });
        allOrders.push(...(orders.data as Order[]));

        setVaultOpenOrders(vaultAddr, [...allOrders]);

        const subscription = await subscriptionClient.accountOrderUpdates(
          { address: subVaultAddress },
          (event: CustomEvent<Order>) => {
            const updatedOpenOrders = event.detail;
            updateVaultOpenOrders(vaultAddr, updatedOpenOrders);
          },
        );
        subscriptions.push(subscription);
      } catch (err) {
        console.error('Error with sub-vault open orders:', subVaultAddress, err);
      }
    },
    [infoClient, subscriptionClient, setVaultOpenOrders, updateVaultOpenOrders],
  );

  const fetchAndSubscribeToOpenOrders = useCallback(async () => {
    const subscriptions: { unsubscribe: () => void }[] = [];

    if (vaultAddress && subVaultAddresses.length === 0) {
      return subscriptions;
    }

    try {
      setLoading(true);
      setError(null);

      if (vaultAddress) {
        const allOrders: Order[] = [];

        await Promise.all(
          subVaultAddresses.map((subVaultAddress) =>
            fetchAndSubscribeToSubVault(vaultAddress, subVaultAddress, allOrders, subscriptions),
          ),
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orders: any = await infoClient.openOrders({
          user: address,
        });
        setOpenOrders(orders.data as Order[]);

        const subscription = await subscriptionClient.accountOrderUpdates(
          { address: address as string },
          (event: CustomEvent<Order>) => {
            const updatedOpenOrders = event.detail;
            updateOpenOrders(updatedOpenOrders);
          },
        );
        subscriptions.push(subscription);
      }
    } catch (err) {
      console.error('[OPEN_ORDERS] Error initializing open orders:', err);
      setError('Failed to fetch open orders');
    } finally {
      setLoading(false);
    }
    return subscriptions;
  }, [
    address,
    vaultAddress,
    subVaultAddresses,
    fetchAndSubscribeToSubVault,
    infoClient,
    subscriptionClient,
    setOpenOrders,
    updateOpenOrders,
  ]);

  useEffect(() => {
    if (!enabled || !address || status === 'disconnected') return;

    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    fetchAndSubscribeToOpenOrders()
      .then((subs) => {
        subscriptionsRef.current = subs;
      })
      .catch((err) => {
        console.error('Error initializing open orders:', err);
      });

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [enabled, address, status, fetchAndSubscribeToOpenOrders]);

  return {
    isLoading,
    error,
  };
}
