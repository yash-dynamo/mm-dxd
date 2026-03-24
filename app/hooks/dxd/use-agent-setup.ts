'use client';

import { useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { useAuthStore, useDxdAuthStore } from '@/stores';
import { useAccountActions } from '@/hooks/actions';

const AGENT_VALID_DAYS = Number(process.env.NEXT_PUBLIC_AGENT_VALID_DAYS ?? 30);
const SESSION_KEY = 'dxd_agent_pk';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type AgentSetupStatus =
  | 'idle'
  | 'generated'
  | 'registering'
  | 'done'
  | 'error';

interface GeneratedAgent {
  privateKey: string;
  agentAddress: string;
}

export function useAgentSetup() {
  const [setupStatus, setSetupStatus] = useState<AgentSetupStatus>('idle');
  const [generatedAgent, setGeneratedAgent] = useState<GeneratedAgent | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const { address: wagmiAddress } = useAccount();
  const { setAgentInfo } = useDxdAuthStore();
  const { addAgent } = useAccountActions();

  /** Step 1: generate key pair in-browser and surface to UI */
  const generateAgent = useCallback(() => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    setGeneratedAgent({ privateKey, agentAddress: account.address });
    setSetupStatus('generated');
  }, []);

  /** Step 2: register agent on-chain via the main wallet (EOA popup) */
  const registerAgent = useCallback(
    async (agentName: string) => {
      if (!generatedAgent) return;

      try {
        setSetupError(null);
        setSetupStatus('registering');

        // Read address & master fresh from stores at call time to avoid stale closures
        const { address: storeAddress, master, activeVault } = useAuthStore.getState();
        const currentAddress = wagmiAddress ?? storeAddress;
        const currentMaster = master;

        if (!currentAddress || currentAddress === ZERO_ADDRESS) {
          throw new Error('No wallet connected');
        }
        if (!currentMaster || currentMaster === ZERO_ADDRESS) {
          throw new Error('Wallet not fully initialised — try again in a moment');
        }

        // Keep timestamp unit aligned with existing working agent flows (milliseconds).
        const validUntil = Date.now() + AGENT_VALID_DAYS * 24 * 60 * 60 * 1000;
        // SDK expects forAccount to be active vault address or empty string for main account.
        const forAccount = activeVault && activeVault !== ZERO_ADDRESS ? activeVault : '';
        const signer = currentAddress;

        const result = await addAgent(
          agentName,
          generatedAgent.agentAddress as `0x${string}`,
          generatedAgent.privateKey,
          forAccount,
          validUntil,
          signer,
          true,
          { context: { source: 'api-agent' } },
        );

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to add agent');
        }

        // Persist private key to sessionStorage (clears on tab close)
        // Never written to localStorage or any Zustand store
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_KEY, generatedAgent.privateKey);
        }

        setAgentInfo(generatedAgent.agentAddress, agentName);

        // Clear private key from React state — it lives only in sessionStorage now
        setGeneratedAgent((prev) => prev ? { ...prev, privateKey: '' } : null);
        setSetupStatus('done');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Agent registration failed';
        setSetupError(msg);
        setSetupStatus('error');
      }
    },
    [generatedAgent, wagmiAddress, addAgent, setAgentInfo],
  );

  /** Read the agent private key from sessionStorage (for session creation) */
  const getAgentPrivateKey = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_KEY);
  }, []);

  return {
    setupStatus,
    generatedAgent,
    setupError,
    generateAgent,
    registerAgent,
    getAgentPrivateKey,
  };
}
