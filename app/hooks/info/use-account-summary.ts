import { useCallback, useEffect, useRef } from 'react';
import { useInfoClient } from './use-info-client';
import { useSubscriptionClient } from './use-subscription-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { AccountSummary, Position } from '@/types/trading';
import { Address } from 'viem';
import { useAgentWallets } from './use-agent-wallets';
import { SubVault, Vault } from '@/types/vault';
import { normalizeAddress } from '@/utils/formatting';

export function useAccountSummary() {
  const { infoClient } = useInfoClient();
  const { address, master } = useAuthStore();
  const { subscriptionClient } = useSubscriptionClient();
  const { resendEnableTradingRequest } = useAgentWallets();

  const accountSummarySubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const transformPerpPositionsToPositions = useCallback(
    (accountSummary: AccountSummary): Position[] => {
      const positions: Position[] = [];
      const perpPositions = accountSummary.perp_positions || {};

      Object.entries(perpPositions).forEach(([instrument, perpPosition]) => {
        perpPosition.legs.forEach((leg) => {
          positions.push({
            margin: perpPosition.im.toString(),
            entry_price: leg.entry_price.toString(),
            instrument: leg.instrument_name || instrument,
            instrument_id: leg.instrument_id,
            leverage: leg.leverage.value.toString(),
            liquidation_price: perpPosition.liquidation_price.toString(),
            margin_mode: leg.leverage.type,
            position_side: leg.side,
            position_value: leg.position_value.toString(),
            size: leg.size.toString(),
            updated_at: Date.now(), // Account summary doesn't have timestamp, use current time
            user: accountSummary.address,
          });
        });
      });

      return positions;
    },
    [],
  );

  const handleAccountSummaryUpdate = useCallback(
    async (event: CustomEvent<AccountSummary>) => {
      const updatedAccountSummary = event.detail;
      
      // Get store actions via getState() for stable references
      const { updateAccountSummary: updateAccSummary, setPositions: setPos } = 
        useUserTradingDataStore.getState();
      const { updateStatusFromAccountSummary: updateStatus } = useAuthStore.getState();
      
      updateAccSummary(updatedAccountSummary);

      // Transform and update positions from account summary
      const positions = transformPerpPositionsToPositions(updatedAccountSummary);
      setPos(positions);

      const hasCollateral =
        Object.keys(updatedAccountSummary.collateral).length > 0 ||
        Object.keys(updatedAccountSummary.spot_collateral).length > 0;

      const currentStatus = useAuthStore.getState().status;

      if (currentStatus === 'user-not-found' && hasCollateral) {
        await resendEnableTradingRequest();
        updateStatus(hasCollateral);
      }
    },
    [resendEnableTradingRequest, transformPerpPositionsToPositions],
  );

  const fetchAccountSummary = useCallback(
    async (addr: Address) => {
      // Normalize address before API call to ensure checksummed format
      // This is defensive - some wallets (like Rabby) may return lowercase addresses
      const normalizedAddr = normalizeAddress(addr);
      
      // Get store actions via getState() for stable references
      const {
        setLoadingTable,
        setAccountSummary,
        setPositions,
        setSuccessTable,
        setError,
        setLoading,
      } = useUserTradingDataStore.getState();
      const { updateStatusFromAccountSummary } = useAuthStore.getState();

      try {
        setLoadingTable(true, 'positions');
        const accountSummary = await infoClient.accountSummary({
          user: normalizedAddr,
        });

        const accountSummaryData = accountSummary as AccountSummary;
        setAccountSummary(accountSummaryData);

        // Transform and set positions from account summary
        const positions = transformPerpPositionsToPositions(accountSummaryData);
        setPositions(positions);
        setSuccessTable(true, 'positions');
        setError(null);

        const hasCollateral =
          Object.keys(accountSummaryData?.collateral).length > 0 ||
          Object.keys(accountSummaryData?.spot_collateral).length > 0;

        if (hasCollateral) {
          await resendEnableTradingRequest();
        }
        updateStatusFromAccountSummary(hasCollateral);

        try {
          if (accountSummarySubscriptionRef.current) {
            accountSummarySubscriptionRef.current.unsubscribe();
          }

          accountSummarySubscriptionRef.current = await subscriptionClient.accountSummary(
            { user: normalizedAddr },
            handleAccountSummaryUpdate,
          );
        } catch (subscriptionErr) {
          console.error('Failed to subscribe to account summary updates:', subscriptionErr);
        }
      } catch (err) {
        console.error('Error fetching account summary:', err);
        setError('Failed to fetch account summary');
        setSuccessTable(false, 'positions');
      } finally {
        setLoading(false);
        setLoadingTable(false, 'positions');
      }
    },
    [
      infoClient,
      subscriptionClient,
      handleAccountSummaryUpdate,
      resendEnableTradingRequest,
      transformPerpPositionsToPositions,
    ],
  );

  const fetchVaults = useCallback(
    async (addr: Address) => {
      const { setVaults, setSubVaults } = useUserTradingDataStore.getState();
      
      try {
        const vaults = (await infoClient.getVaults({ user: addr })) as unknown as {
          vaults: Vault[];
        };
        setVaults(vaults.vaults);

        for (const vault of vaults.vaults) {
          const subVaults = await infoClient.getSubVaults({ vaultAddress: vault.vault_address });
          setSubVaults(subVaults as SubVault[]);
        }
      } catch (err) {
        console.error('Error fetching vaults:', err);
      }
    },
    [infoClient],
  );

  useEffect(() => {
    if (address && address !== '0x0000000000000000000000000000000000000000') {
      const currentStatus = useAuthStore.getState().status;
      if (currentStatus !== 'disconnected') {
        fetchAccountSummary(address);
      }
    }

    return () => {
      if (accountSummarySubscriptionRef.current) {
        accountSummarySubscriptionRef.current.unsubscribe();
        accountSummarySubscriptionRef.current = null;
      }
    };
  }, [address, fetchAccountSummary]);

  useEffect(() => {
    if (master && master !== '0x0000000000000000000000000000000000000000') {
      fetchVaults(master);
    }
  }, [master, fetchVaults]);

  return {};
}
