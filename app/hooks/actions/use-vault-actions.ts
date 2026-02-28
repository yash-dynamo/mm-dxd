import { useCallback } from 'react';
import { useActionWrapper } from './use-action-wrapper';
import { Address } from 'viem';
import { actions } from './config';

export function useVaultActions() {
  const { executeL1Action } = useActionWrapper();

  const depositToVault = useCallback(
    async (vaultAddress: Address, amount: string) => {
      return executeL1Action(actions.depositToVault, (client) =>
        client.depositToVault({
          vaultAddress,
          amount,
        }),
      );
    },
    [executeL1Action],
  );

  const redeemFromVault = useCallback(
    async (vaultAddress: Address, shares: string) => {
      return executeL1Action(actions.redeemFromVault, (client) =>
        client.redeemFromVault({
          vaultAddress,
          shares,
        }),
      );
    },
    [executeL1Action],
  );

  const sendToSubVault = useCallback(
    async (vaultAddress: Address, subVaultAddress: Address, amount: string) => {
      return executeL1Action(actions.sendToSubVault, (client) =>
        client.sendToSubVault({
          parentProtocolVault: vaultAddress,
          subVaultAddress: [subVaultAddress],
          amounts: [amount],
        }),
      );
    },
    [executeL1Action],
  );

  const withdrawFromSubVault = useCallback(
    async (vaultAddress: Address, subVaultAddress: Address, amount: string) => {
      return executeL1Action(actions.withdrawFromSubVault, (client) =>
        client.withdrawFromSubVault({
          parentProtocolVault: vaultAddress,
          subVaultAddress: [subVaultAddress],
          amounts: [amount],
        }),
      );
    },
    [executeL1Action],
  );

  return {
    depositToVault,
    redeemFromVault,
    sendToSubVault,
    withdrawFromSubVault,
  };
}
