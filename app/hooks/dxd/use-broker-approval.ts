'use client';

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { useAuthStore, useDxdAuthStore } from '@/stores';
import { useAccountActions } from '@/hooks/actions';
import { useInfoClient } from '@/hooks/info/use-info-client';
import { showToast } from '@/components/ui/toast';

const APPROVAL_KEY_PREFIX = 'dxd_broker_approved_v1';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function toLower(value: string) {
  return value.trim().toLowerCase();
}

function isLinkageCheckSdkMismatchError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('failed wallet/agent linkage check')
    || lower.includes('wallet/agent linkage')
    || lower.includes("has no attribute 'agents'")
    || (lower.includes('infoclient') && lower.includes('agents'))
  );
}

function buildApprovalKey(wallet: string, brokerAddress: string, maxFeeRate: string) {
  return `${APPROVAL_KEY_PREFIX}:${toLower(wallet)}:${toLower(brokerAddress)}:${maxFeeRate.trim()}`;
}

function getConnectedWalletAddress(wagmiAddress?: `0x${string}`): string | null {
  const { address: storeAddress } = useAuthStore.getState();
  const candidate = wagmiAddress ?? storeAddress;
  if (!candidate || candidate === ZERO_ADDRESS) return null;
  return candidate;
}

export function useBrokerApproval() {
  const { address: wagmiAddress } = useAccount();
  const { approveBrokerFee } = useAccountActions();
  const { infoClient } = useInfoClient();

  const hasLocalApproval = useCallback(
    (walletAddress: string, brokerAddress: string, maxFeeRate: string): boolean => {
      if (typeof window === 'undefined') return false;
      return !!window.localStorage.getItem(buildApprovalKey(walletAddress, brokerAddress, maxFeeRate));
    },
    [],
  );

  const markLocalApproval = useCallback((walletAddress: string, brokerAddress: string, maxFeeRate: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      buildApprovalKey(walletAddress, brokerAddress, maxFeeRate),
      JSON.stringify({ approvedAt: new Date().toISOString() }),
    );
  }, []);

  const hasOnchainApproval = useCallback(
    async (walletAddress: string, brokerAddress: string) => {
      try {
        const res = await infoClient.brokersCheck({
          user: walletAddress as Address,
          broker: brokerAddress as Address,
          limit: 20,
          page: 1,
        });
        return (
          Array.isArray(res?.data)
          && res.data.some(
            (row) =>
              toLower(String(row.account ?? '')) === toLower(walletAddress)
              && toLower(String(row.broker ?? '')) === toLower(brokerAddress),
          )
        );
      } catch {
        return false;
      }
    },
    [infoClient],
  );

  const ensureBrokerApproval = useCallback(
    async ({
      brokerAddress,
      maxFeeRate,
      force = false,
    }: {
      brokerAddress: string;
      maxFeeRate: string;
      force?: boolean;
    }) => {
      const walletAddress = getConnectedWalletAddress(wagmiAddress);
      if (!walletAddress) {
        throw new Error('No wallet connected for broker approval');
      }
      const { isAuthenticated, dxdWalletAddress } = useDxdAuthStore.getState();
      if (
        isAuthenticated &&
        dxdWalletAddress &&
        toLower(dxdWalletAddress) !== toLower(walletAddress)
      ) {
        throw new Error('Connected wallet does not match your DXD sign-in wallet');
      }

      const broker = brokerAddress?.trim();
      if (!broker || !broker.startsWith('0x') || broker.length !== 42) {
        throw new Error('Broker address is invalid or missing');
      }

      if (!force && hasLocalApproval(walletAddress, broker, maxFeeRate)) {
        return;
      }

      if (!force) {
        const alreadyApproved = await hasOnchainApproval(walletAddress, broker);
        if (alreadyApproved) {
          markLocalApproval(walletAddress, broker, maxFeeRate);
          return;
        }
      }

      try {
        const result = await approveBrokerFee(broker as Address, maxFeeRate);
        if (!result?.success) {
          throw new Error(result?.error || 'Broker approval failed');
        }
        markLocalApproval(walletAddress, broker, maxFeeRate);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!isLinkageCheckSdkMismatchError(msg)) {
          throw err;
        }

        // SDK/back-end mismatch workaround:
        // when linkage validation endpoint is broken upstream, check if approval
        // already exists on-chain and proceed to unblock setup.
        const hasApproval = await hasOnchainApproval(walletAddress, broker);
        if (hasApproval) {
          markLocalApproval(walletAddress, broker, maxFeeRate);
          showToast.info({
            message: 'Broker approval already active',
            description: 'Recovered from linkage check mismatch and continued setup.',
          });
          return;
        }

        markLocalApproval(walletAddress, broker, maxFeeRate);
        showToast.warning({
          message: 'Broker approval check bypassed',
          description:
            'Detected backend SDK mismatch in linkage check. Setup will continue; if orders fail later, retry approval after backend update.',
        });
        return;
      }
    },
    [approveBrokerFee, hasLocalApproval, markLocalApproval, wagmiAddress, hasOnchainApproval],
  );

  return { ensureBrokerApproval, hasLocalApproval };
}
