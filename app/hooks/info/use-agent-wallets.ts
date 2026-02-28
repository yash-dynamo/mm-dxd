import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useSubscriptionClient } from './use-subscription-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { AgentWallet } from '@/types/trading';
import { HttpTransport } from '@0xsyndr/ts-sdk';
import server from '@/config/server';
import { showToast } from '@/components/ui/toast';
import { env } from '@/config';

export function useAgentWallets() {
  const { setAgentWallets } = useUserTradingDataStore();
  const { infoClient } = useInfoClient();
  const { subscriptionClient } = useSubscriptionClient();
  const { address, status, pendingAgents, clearPendingAgent, setAgent, clearAgent, setStatus } =
    useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const agentsSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Helper function to validate agent wallets
  const validateAgentWallets = useCallback(
    (agentWallets: AgentWallet[]) => {
      const agents = useAuthStore.getState().agents;
      const currentAuthAgent = agents[address];

      if (!currentAuthAgent || currentAuthAgent.name === 'qr-code') {
        return; // Skip validation if no auth agent or using qr-code
      }

      const defaultAgent = agentWallets.find((agent) => agent.agent_name === 'default');

      // Check 1: No default agent exists
      if (!defaultAgent) {
        console.warn('No default agent found. Clearing auth agent.');
        clearAgent(address);
        setStatus('connected');
        showToast.warning({
          message: 'Trading disabled. Please enable trading.',
        });
        return;
      }

      // Check 2: Default agent address mismatch
      if (defaultAgent.agent_address.toLowerCase() !== currentAuthAgent.address.toLowerCase()) {
        console.warn(
          'Default agent address does not match auth agent address. Clearing auth agent.',
        );
        clearAgent(address);
        setStatus('connected');
        showToast.warning({
          message: 'Agent wallet mismatch detected. Trading has been disabled.',
        });
        return;
      }

      // Check 3: More than 3 agents AND default agent is older than all others
      if (agentWallets.length > 3) {
        const otherAgents = agentWallets.filter((agent) => agent.agent_name !== 'default');
        const isDefaultOlderThanAll = otherAgents.every(
          (agent) => defaultAgent.created_at_block_timestamp < agent.created_at_block_timestamp,
        );

        if (isDefaultOlderThanAll) {
          console.warn(
            'More than 3 agents detected and default agent is older than all others. Clearing auth agent.',
          );
          clearAgent(address);
          setStatus('connected');
          showToast.warning({
            message: 'Unauthorized agent detected. Trading has been disabled.',
          });
          return;
        }
      }
    },
    [address, clearAgent, setStatus],
  );

  const fetchAgentWallets = useCallback(async () => {
    try {
      setLoading(true);
      const agentWallets = await infoClient.getAgents({
        user: address,
      });
      if (address) {
        setAgentWallets(agentWallets as AgentWallet[]);

        // Validate agent wallets
        validateAgentWallets(agentWallets as AgentWallet[]);
      } else {
        setAgentWallets(agentWallets as AgentWallet[]);
      }
    } catch (err) {
      console.error('Error fetching agent wallets:', err);
      setError('Failed to fetch agent wallets');
    } finally {
      setLoading(false);
    }
  }, [address, infoClient, setAgentWallets, validateAgentWallets]);

  const resendEnableTradingRequest = useCallback(async () => {
    try {
      setLoading(true);

      const transport = new HttpTransport({
        env: env.NEXT_PUBLIC_ENVIRONMENT,
        ...server.http,
      });

      const pendingAgent = pendingAgents[address];

      if (!pendingAgent) {
        return { success: false, error: 'No pending agent found' };
      }

      const response = await transport.request('exchange', {
        action: {
          data: pendingAgent?.params,
          type: '1201',
        },
        signature: pendingAgent?.signature,
        nonce: pendingAgent?.params.nonce,
      });

      clearPendingAgent(address);

      setAgent(address, {
        name: pendingAgent?.params.agentName,
        address: pendingAgent?.params.agent,
        privateKey: pendingAgent?.privateKey,
      });

      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      showToast.error({
        message: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }, [address, pendingAgents, clearPendingAgent, setAgent]);

  const subscribeToAgents = useCallback(async () => {
    try {
      const subscription = await subscriptionClient.agents(
        { user: address },
        (
          event: CustomEvent<{
            main_account: string;
            agent_address: string;
            agent_name: string;
            valid_until: number;
            block_timestamp: number;
          }>,
        ) => {
          const agentUpdate = event.detail;

          // Map WebSocket event to AgentWallet format
          const updatedAgent: AgentWallet = {
            user: agentUpdate.main_account as `0x${string}`,
            agent_address: agentUpdate.agent_address as `0x${string}`,
            agent_name: agentUpdate.agent_name,
            valid_until_timestamp: agentUpdate.valid_until,
            created_at_block_timestamp: agentUpdate.block_timestamp,
          };

          // Get current agent wallets and update/add the agent
          const currentAgentWallets = useUserTradingDataStore.getState().agentWallets;
          const updatedWallets = currentAgentWallets.filter(
            (wallet) =>
              !(
                wallet.user.toLowerCase() === updatedAgent.user.toLowerCase() &&
                wallet.agent_name === updatedAgent.agent_name
              ),
          );
          updatedWallets.push(updatedAgent);
          setAgentWallets(updatedWallets);

          // Validate agent wallets
          validateAgentWallets(updatedWallets);
        },
      );

      agentsSubscriptionRef.current = subscription;
    } catch (subscriptionErr) {
      console.error('Failed to subscribe to agent updates:', subscriptionErr);
    }
  }, [address, subscriptionClient, setAgentWallets, validateAgentWallets]);

  useEffect(() => {
    if (address && status !== 'disconnected') {
      // Initial fetch
      fetchAgentWallets();

      // Subscribe to agent updates via WebSocket
      subscribeToAgents();

      // Cleanup subscription on unmount
      return () => {
        if (agentsSubscriptionRef.current) {
          try {
            agentsSubscriptionRef.current.unsubscribe();
          } catch (unsubscribeErr) {
            console.error('Failed to unsubscribe from agent updates on cleanup:', unsubscribeErr);
          } finally {
            agentsSubscriptionRef.current = null;
          }
        }
      };
    }
  }, [address, status, fetchAgentWallets, subscribeToAgents]);

  return {
    isLoading,
    error,
    fetchAgentWallets,
    resendEnableTradingRequest,
  };
}
