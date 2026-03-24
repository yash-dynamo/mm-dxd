import { useCallback } from 'react';
import { Address } from 'viem';
import { useActionWrapper } from './use-action-wrapper';
import { actions } from './config';

export function useAccountActions() {
  const { executeUserAction, executeL1Action } = useActionWrapper();

  const addAgent = useCallback(
    async (
      agentName: string,
      agentAddress: `0x${string}`,
      agentPrivateKey: string,
      forAccount: string,
      validUntil: number,
      signer: `0x${string}`,
      executeAction: boolean = true,
      options?: { context?: { source?: string }; skipToast?: boolean },
    ) => {
      const context = options?.context ?? {};
      const skipToast = options?.skipToast ?? false;

      if (executeAction) {
        return executeUserAction(
          actions.addAgent,
          (client) =>
            client.addAgent({
              agentName,
              agent: agentAddress,
              forAccount,
              agentPrivateKey,
              validUntil,
              signer,
            }),
          skipToast,
          context,
        );
      }
      return executeUserAction(
        actions.addAgent,
        (client) =>
          client.addAgent(
            {
              agentName,
              agent: agentAddress,
              forAccount,
              agentPrivateKey,
              validUntil,
              signer,
            },
            false,
          ),
        skipToast,
        context,
      );
    },
    [executeUserAction],
  );

  const approveBrokerFee = useCallback(
    async (broker: Address, maxFeeRate: string) => {
      return executeUserAction('Approve Broker Fee', (client) =>
        client.approveBrokerFee({
          broker,
          maxFeeRate,
        }),
      );
    },
    [executeUserAction],
  );

  const createReferralCode = useCallback(
    async (code: string) => {
      return executeL1Action(actions.createReferralCode, (client) =>
        client.createReferralCode({ code }),
      );
    },
    [executeL1Action],
  );

  const setReferrer = useCallback(
    async (code: string) => {
      return executeL1Action('Set Referrer', (client) => client.setReferrer({ code }));
    },
    [executeL1Action],
  );

  const claimReferralRewards = useCallback(
    async (collateralId: number, spot: boolean) => {
      return executeL1Action('Claim Referral Rewards', (client) =>
        client.claimReferralRewards({
          collateralId,
          spot,
        }),
      );
    },
    [executeL1Action],
  );

  const revokeAgent = useCallback(
    async (agentAddress: Address) => {
      return executeL1Action(actions.revokeAgent, (client) =>
        client.revokeAgent({
          agent: agentAddress,
        }),
      );
    },
    [executeL1Action],
  );

  return {
    addAgent,
    approveBrokerFee,
    createReferralCode,
    setReferrer,
    claimReferralRewards,
    revokeAgent,
  };
}
