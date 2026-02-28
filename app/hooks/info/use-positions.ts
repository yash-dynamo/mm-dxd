import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore, useUserTradingDataStore, useVaultsStore } from '@/stores';
import { Position, UpdatedPosition } from '@/types/trading';
import { useSubscriptionClient } from './use-subscription-client';
import { useInfoClient } from './use-info-client';
import { getSubVaultAdresses } from '@/utils/global';

interface UsePositionsProps {
  vaultAddress?: string;
  enabled?: boolean;
}

const transformUpdatedPosition = (updatedPosition: UpdatedPosition): Position[] => {
  return updatedPosition?.legs.map((leg) => ({
    entry_price: leg.entry_price.toString(),
    instrument: updatedPosition.instrument,
    instrument_id: updatedPosition.instrument_id,
    leverage: leg.leverage.value.toString(),
    margin_mode: leg.leverage.type,
    position_side: leg.side,
    position_value: leg.position_value.toString(),
    size: leg.size.toString(),
    updated_at: updatedPosition.block_timestamp,
    user: updatedPosition.account,
  }));
};

export function usePositions({ vaultAddress, enabled = true }: UsePositionsProps = {}) {
  const { updatePositions, deletePosition, setError, setLoadingTable, setSuccessTable } =
    useUserTradingDataStore();
  const {
    setVaultPositions,
    updateVaultPositions,
    deleteVaultPosition,
    setLoadingTable: setVaultLoadingTable,
    setSuccessTable: setVaultSuccessTable,
  } = useVaultsStore();
  const subVaults = useVaultsStore(
    useShallow((state) => (vaultAddress ? (state.subVaults[vaultAddress] ?? []) : [])),
  );
  const subVaultAddresses = useMemo(
    () =>
      getSubVaultAdresses(
        subVaults
          .map((subVault) => subVault.sub_vault_address)
          .filter((address): address is string => Boolean(address)),
      ),
    [subVaults],
  );
  const { subscriptionClient } = useSubscriptionClient();
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();

  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  const subscribeToSubVault = useCallback(
    async (
      vaultAddr: string,
      subVaultAddress: string,
      subscriptions: { unsubscribe: () => void }[],
    ) => {
      try {
        // Subscribe to position updates (initial fetch is done in use-sub-vaults)
        const subscription = await subscriptionClient.positions(
          { address: subVaultAddress },
          (event: CustomEvent<UpdatedPosition>) => {
            const updatedPosition = event.detail;
            if (updatedPosition?.legs?.length > 0) {
              const transformedPositions = transformUpdatedPosition(updatedPosition);
              updateVaultPositions(vaultAddr, transformedPositions);
            } else {
              deleteVaultPosition(
                vaultAddr,
                String(updatedPosition.instrument_id),
                updatedPosition.position_side_updated,
              );
            }
          },
        );
        subscriptions.push(subscription);
      } catch (err) {
        console.error('Error subscribing to sub-vault positions:', subVaultAddress, err);
        setError('Failed to subscribe to positions');
      }
    },
    [subscriptionClient, updateVaultPositions, deleteVaultPosition, setError],
  );

  const subscribeToPositions = useCallback(async () => {
    const subscriptions: { unsubscribe: () => void }[] = [];

    if (vaultAddress && subVaultAddresses.length === 0) {
      return subscriptions;
    }

    try {
      if (vaultAddress) {
        setError(null);

        // Only subscribe to position updates (initial fetch is done in use-sub-vaults)
        await Promise.all(
          subVaultAddresses.map((subVaultAddress) =>
            subscribeToSubVault(vaultAddress, subVaultAddress, subscriptions),
          ),
        );
      } else {
        // Skip initial fetch - positions are set from account summary
        // Only set up subscription for real-time updates
        setError(null);
        const subscription = await subscriptionClient.positions(
          { address: address },
          (event: CustomEvent<UpdatedPosition>) => {
            const updatedPosition = event.detail;
            if (updatedPosition?.legs && updatedPosition?.legs?.length > 0) {
              const transformedPositions = transformUpdatedPosition(updatedPosition);
              updatePositions(transformedPositions);
            } else {
              deletePosition(
                String(updatedPosition.instrument_id),
                updatedPosition.position_side_updated,
              );
            }
          },
        );
        subscriptions.push(subscription);
      }
    } catch (err) {
      console.error('Error fetching/subscribing to positions:', err);
      if (vaultAddress) {
        setVaultSuccessTable(vaultAddress, false, 'positions');
      } else {
        setError('Failed to fetch positions');
      }
    } finally {
      if (vaultAddress) {
        setVaultLoadingTable(vaultAddress, false, 'positions');
      }
    }
    return subscriptions;
  }, [
    address,
    vaultAddress,
    subVaultAddresses,
    subscribeToSubVault,
    subscriptionClient,
    updatePositions,
    deletePosition,
    setError,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (!vaultAddress && (!address || status === 'disconnected')) return;

    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    subscribeToPositions()
      .then((subs) => {
        subscriptionsRef.current = subs;
      })
      .catch((err) => {
        console.error('Error subscribing to positions:', err);
      });

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [enabled, address, status, vaultAddress, subscribeToPositions]);

  return {};
}
