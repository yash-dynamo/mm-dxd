import { useCallback, useEffect, useRef } from 'react';
import { useInfoClient } from './use-info-client';
import { useSubscriptionClient } from './use-subscription-client';
import { useVaultsStore, useAccountHistoryStore, useAuthStore } from '@/stores';
import { Vault } from '@/types/vault';
import { AccountSummary } from '@/types/trading';
import { env } from '@/config';
import { Address } from 'viem';

export function useVaults() {
  const { infoClient } = useInfoClient();
  const { subscriptionClient } = useSubscriptionClient();
  const {
    setFeeReceiver,
    setVaults,
    setVaultAccountSummary,
    updateVaultAccountSummary,
    setLoading,
    success,
    isLoading,
    vaults,
  } = useVaultsStore();
  const { setAccountHistory } = useAccountHistoryStore();
  const { address, status } = useAuthStore();
  const subscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);
  const isSubscribingRef = useRef(false);
  const isSubscribedRef = useRef(false);

  const fetchVaults = useCallback(
    async (success: boolean, isSubscribed: boolean) => {
      try {
        let data: { vaults: Vault[] } = { vaults: [] };
        if (!success && !isLoading) {
          setLoading(true);
          data = (await infoClient.getVaults({})) as unknown as { vaults: Vault[] };
          setVaults(data.vaults);
        }

        if (!isSubscribed && !isLoading && !isSubscribingRef.current) {
          isSubscribingRef.current = true;
          // Clean up previous subscriptions
          subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
          subscriptionsRef.current = [];
          isSubscribedRef.current = false;

          const vaultsToSubscribe = data.vaults.length > 0 ? data.vaults : Object.values(vaults);
          // Fetch and subscribe to account summary for each vault
          for (const vault of vaultsToSubscribe) {
            try {
              isSubscribingRef.current = true;
              const accountSummary = await infoClient.accountSummary({
                user: vault.vault_address,
              });
              setVaultAccountSummary(vault.vault_address, accountSummary as AccountSummary);

              // Subscribe to account summary updates
              const subscription = await subscriptionClient.accountSummary(
                { user: vault.vault_address },
                (event: CustomEvent<AccountSummary>) => {
                  const updatedAccountSummary = event.detail;
                  updateVaultAccountSummary(vault.vault_address, updatedAccountSummary);
                },
              );
              subscriptionsRef.current.push(subscription);
            } catch (e) {
              console.error(
                'Error fetching/subscribing to vault account summary:',
                vault.vault_address,
                e,
              );
            } finally {
              isSubscribingRef.current = false;
            }
          }
          isSubscribedRef.current = true;
          isSubscribingRef.current = false;
        }
      } catch (error) {
        console.error('Error fetching vaults:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      infoClient,
      subscriptionClient,
      setVaults,
      setVaultAccountSummary,
      updateVaultAccountSummary,
      setLoading,
    ],
  );

  const fetchFeeReceiver = useCallback(async () => {
    // Fee receiver address is not configured in this template — skip.
  }, []);

  const setup = useCallback(async () => {
    await Promise.all([
      fetchVaults(success, isSubscribedRef.current),
      fetchFeeReceiver(),
    ]);
  }, [fetchVaults, fetchFeeReceiver, success, isSubscribedRef.current]);

  useEffect(() => {
    setup();
    return () => {
      isSubscribedRef.current = false;
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [
    infoClient,
    subscriptionClient,
    setVaults,
    setVaultAccountSummary,
    updateVaultAccountSummary,
    setAccountHistory,
    address,
    status,
    setLoading,
    success,
    fetchVaults,
  ]);

  return {};
}
