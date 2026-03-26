'use client';

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { useAuthStore } from '@/stores';
import { useAccountActions } from '@/hooks/actions';

const APPROVAL_KEY_PREFIX = 'dxd_broker_approved_v1';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function toLower(value: string) {
  return value.trim().toLowerCase();
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

      const broker = brokerAddress?.trim();
      if (!broker || !broker.startsWith('0x') || broker.length !== 42) {
        throw new Error('Broker address is invalid or missing');
      }

      if (!force && hasLocalApproval(walletAddress, broker, maxFeeRate)) {
        return;
      }

      const result = await approveBrokerFee(broker as Address, maxFeeRate);
      if (!result?.success) {
        throw new Error(result?.error || 'Broker approval failed');
      }

      markLocalApproval(walletAddress, broker, maxFeeRate);
    },
    [approveBrokerFee, hasLocalApproval, markLocalApproval, wagmiAddress],
  );

  return { ensureBrokerApproval, hasLocalApproval };
}
