import { useCallback } from 'react';
import { useActionWrapper } from './use-action-wrapper';
import { Address } from 'viem';
import { actions } from './config';

export function useTransferActions() {
  const { executeUserAction } = useActionWrapper();

  const accountSpotWithdrawRequest = useCallback(
    async (collateralId: number, amount: string, chainId: number) => {
      return executeUserAction(actions.accountSpotWithdrawRequest, (client) =>
        client.accountSpotWithdrawRequest({
          collateralId,
          amount,
          chainId,
        }),
      );
    },
    [executeUserAction],
  );

  const accountDerivativeWithdrawRequest = useCallback(
    async (collateralId: number, amount: string, chainId: number) => {
      return executeUserAction(actions.accountDerivativeWithdrawRequest, (client) =>
        client.accountDerivativeWithdrawRequest({
          collateralId,
          amount,
          chainId,
        }),
      );
    },
    [executeUserAction],
  );

  const accountSpotBalanceTransferRequest = useCallback(
    async (
      collateralId: number,
      amount: string,
      destination: Address,
      context?: { amount?: string; token?: string; recipient?: string },
    ) => {
      return executeUserAction(
        actions.accountSpotBalanceTransferRequest,
        (client) =>
          client.accountSpotBalanceTransferRequest({
            collateralId,
            amount,
            destination,
          }),
        false,
        context || {},
      );
    },
    [executeUserAction],
  );

  const accountDerivativeBalanceTransferRequest = useCallback(
    async (
      collateralId: number,
      amount: string,
      destination: Address,
      context?: { amount?: string; token?: string; recipient?: string },
    ) => {
      return executeUserAction(
        actions.accountDerivativeBalanceTransferRequest,
        (client) =>
          client.accountDerivativeBalanceTransferRequest({
            collateralId,
            amount,
            destination,
          }),
        false,
        context || {},
      );
    },
    [executeUserAction],
  );

  const accountInternalBalanceTransferRequest = useCallback(
    async (collateralId: number, amount: string, toDerivativesAccount: boolean) => {
      return executeUserAction(actions.accountInternalBalanceTransferRequest, (client) =>
        client.accountInternalBalanceTransferRequest({
          collateralId,
          amount,
          toDerivativesAccount,
        }),
      );
    },
    [executeUserAction],
  );

  const accountSpotWithdrawRequestAction1 = useCallback(
    async (collateralId: number, destination: Address, amount: string, chainId: number) => {
      return executeUserAction(actions.accountSpotWithdrawRequestAction1, (client) =>
        client.accountSpotWithdrawRequestAction1({
          collateralId,
          destination,
          amount,
          chainId,
        }),
      );
    },
    [executeUserAction],
  );

  const accountDerivativeWithdrawRequestAction1 = useCallback(
    async (collateralId: number, destination: Address, amount: string, chainId: number) => {
      return executeUserAction(actions.accountDerivativeWithdrawRequestAction1, (client) =>
        client.accountDerivativeWithdrawRequestAction1({
          collateralId,
          destination,
          amount,
          chainId,
        }),
      );
    },
    [executeUserAction],
  );

  return {
    accountSpotWithdrawRequest,
    accountDerivativeWithdrawRequest,
    accountSpotBalanceTransferRequest,
    accountDerivativeBalanceTransferRequest,
    accountInternalBalanceTransferRequest,
    accountSpotWithdrawRequestAction1,
    accountDerivativeWithdrawRequestAction1,
  };
}
