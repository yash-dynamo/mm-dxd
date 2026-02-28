import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAccountHistoryStore, useVaultsStore } from '@/stores';
import { useVaults } from './use-vaults';
import { SubVault } from '@/types/vault';
import { AccountSummary, Position } from '@/types/trading';
import { useSubscriptionClient } from './use-subscription-client';
import { getSubVaultAdresses } from '@/utils/global';

export function useSubVaults(vaultAddress: string, fetchVaults = true) {
  const { infoClient } = useInfoClient();
  if (fetchVaults) {
    useVaults();
  }
  const {
    setSubVaults,
    success,
    vaults,
    subVaultsSuccess,
    setVaultPositions,
    setLoadingTable,
    setSuccessTable,
    setSubVaultAccountSummary,
    updateSubVaultAccountSummary,
  } = useVaultsStore();
  const { subscriptionClient } = useSubscriptionClient();
  const { setAccountHistory } = useAccountHistoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  useEffect(() => {
    const fetchSubVaults = async () => {
      const subVaults = await infoClient.getSubVaults({
        vaultAddress: vaultAddress,
      });
      setSubVaults(vaultAddress, subVaults as SubVault[]);
      return subVaults as SubVault[];
    };

    const fetchVaultAccountHistory = async () => {
      try {
        const history = await infoClient.accountHistory({ user: vaultAddress });
        if (Array.isArray(history)) {
          setAccountHistory(
            vaultAddress,
            history as unknown as {
              created_at: string;
              account_value: string;
              total_pnl: string;
              total_volume?: string;
            }[],
          );
        }
      } catch (e) {
        console.error('fetchVaults accountHistory error', e);
      }
    };

    const fetchAndSubscribeToSubVaultAccountSummary = async (
      subVaultAddress: string,
      subscriptions: { unsubscribe: () => void }[],
    ) => {
      try {
        // Fetch initial account summary for this sub-vault
        const accountSummary = await infoClient.accountSummary({ user: subVaultAddress });
        const accountSummaryData = accountSummary as AccountSummary;
        setSubVaultAccountSummary(subVaultAddress, accountSummaryData);

        // Subscribe to account summary updates for this sub-vault
        const subscription = await subscriptionClient.accountSummary(
          { user: subVaultAddress },
          (event: CustomEvent<AccountSummary>) => {
            const updatedAccountSummary = event.detail;
            updateSubVaultAccountSummary(subVaultAddress, updatedAccountSummary);
          },
        );
        subscriptions.push(subscription);
      } catch (err) {
        console.error(
          'Error fetching/subscribing to sub-vault account summary:',
          subVaultAddress,
          err,
        );
      }
    };

    const fetchVaultPositions = async (subVaults: SubVault[]) => {
      const subVaultAddresses = getSubVaultAdresses(
        subVaults
          .map((subVault) => subVault.sub_vault_address)
          .filter((address): address is string => Boolean(address)),
      );

      if (subVaultAddresses.length === 0) {
        // No sub-vaults, set empty positions and mark as successful
        setVaultPositions(vaultAddress, []);
        setSuccessTable(vaultAddress, true, 'positions');
        setLoadingTable(vaultAddress, false, 'positions');
        return;
      }

      try {
        setLoadingTable(vaultAddress, true, 'positions');

        // Fetch positions from all sub-vaults in parallel
        const positionsArrays = await Promise.all(
          subVaultAddresses.map(async (subVaultAddress) => {
            try {
              const positions = await infoClient.positions({ user: subVaultAddress });
              return positions as Position[];
            } catch (err) {
              console.error('Error fetching positions for sub-vault:', subVaultAddress, err);
              return [];
            }
          }),
        );

        // Flatten all positions from all sub-vaults - aggregate everything first
        const allPositions = positionsArrays.flat();

        // Set all aggregated positions at once in the vault table (only after all sub-vaults are fetched)
        setVaultPositions(vaultAddress, allPositions);

        // Set success state after all positions are fetched and set
        setSuccessTable(vaultAddress, true, 'positions');
      } catch (e) {
        console.error('Error fetching vault positions:', e);
        setSuccessTable(vaultAddress, false, 'positions');
      } finally {
        setLoadingTable(vaultAddress, false, 'positions');
      }
    };

    if (success && vaultAddress && !subVaultsSuccess[vaultAddress] && !initialLoadingRef.current) {
      initialLoadingRef.current = true;
      // Clean up previous subscriptions
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];

      Promise.all([
        fetchSubVaults().then(async (subVaults) => {
          const subVaultAddresses = getSubVaultAdresses(
            subVaults
              .map((subVault) => subVault.sub_vault_address)
              .filter((address): address is string => Boolean(address)),
          );

          // Fetch and subscribe to account summary for each sub-vault
          await Promise.all(
            subVaultAddresses.map((subVaultAddress) =>
              fetchAndSubscribeToSubVaultAccountSummary(subVaultAddress, subscriptionsRef.current),
            ),
          );

          // Fetch initial positions for all sub-vaults
          await fetchVaultPositions(subVaults);
        }),
        fetchVaultAccountHistory(),
      ])
        .catch((err) => {
          console.error('Error initializing sub-vaults:', err);
          setError(err instanceof Error ? err.message : String(err?.message ?? err));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [
    infoClient,
    subscriptionClient,
    setSubVaults,
    success,
    vaultAddress,
    vaults,
    setAccountHistory,
    setVaultPositions,
    setLoadingTable,
    setSuccessTable,
    setSubVaultAccountSummary,
    updateSubVaultAccountSummary,
    isLoading,
  ]);

  return { isLoading, error };
}
