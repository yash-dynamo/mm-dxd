import { useAccount } from 'wagmi';
import { Config, getWalletClient } from '@wagmi/core';
import { ExchangeClient, HttpTransport } from '@hotstuff-labs/ts-sdk';
import { useAuthStore } from '@/stores';
import { createWalletClient, http, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet as mainnetChain } from 'viem/chains';
import { mainnet } from '@wagmi/core/chains';
import server from '@/config/server';
import { useCallback } from 'react';
import { wagmiConfig } from '@/config/wallet';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { env } from '@/config';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useExchangeClient() {
  const { isConnected } = useAccount();
  const { getAgents, address } = useAuthStore();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const createUserClient = useCallback(
    async (maxRetries = 5, initialDelay = 100) => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Read master at call time so we always get the latest value
        // (avoids stale closure when auth store updates after render)
        const currentMaster = useAuthStore.getState().master;

        if (!currentMaster || currentMaster === '0x0000000000000000000000000000000000000000') {
          if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }
          return null;
        }

        let walletClient;

        // Check if Privy is authenticated and use Privy wallet
        if (authenticated && wallets.length > 0) {
          const privyWallet = wallets[0];

          if (!privyWallet) {
            if (attempt < maxRetries - 1) {
              const delay = initialDelay * Math.pow(2, attempt);
              await sleep(delay);
              continue;
            }
            return null;
          }

          try {
            await privyWallet.switchChain(mainnetChain.id);

            const provider = await privyWallet.getEthereumProvider();

            walletClient = createWalletClient({
              account: currentMaster,
              chain: mainnetChain,
              transport: custom(provider),
            });
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries - 1) {
              const delay = initialDelay * Math.pow(2, attempt);
              await sleep(delay);
              continue;
            }
            return null;
          }
        } else {
          // Switch to mainnet first so getWalletClient returns a mainnet-bound client.
          try {
            const { switchChain } = await import('@wagmi/core');
            await switchChain(wagmiConfig as Config, { chainId: mainnet.id });
          } catch {
            // Already on mainnet or wallet doesn't support programmatic switching
          }

          walletClient = await getWalletClient(wagmiConfig as Config, {
            account: currentMaster,
            chainId: mainnet.id,
          });
          if (!walletClient || !isConnected) {
            if (attempt < maxRetries - 1) {
              const delay = initialDelay * Math.pow(2, attempt);
              await sleep(delay);
              continue;
            }
            return null;
          }
        }

        try {
          const transport = new HttpTransport({
            env: env.NEXT_PUBLIC_ENVIRONMENT,
            ...server.http,
          });

          return new ExchangeClient({
            transport,
            wallet: walletClient,
          });
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            await sleep(delay);
          }
        }
      }

      console.error('Failed to create user wallet client after retries:', lastError);
      return null;
    },
    [isConnected, authenticated, wallets],
  );

  const createL1Client = useCallback(() => {
    const agents = useAuthStore.getState().agents;

    const defaultAgent = agents[address] || null;

    if (!defaultAgent?.privateKey) {
      return null;
    }

    try {
      const account = privateKeyToAccount(defaultAgent.privateKey as `0x${string}`);

      const transport = new HttpTransport({
        env: env.NEXT_PUBLIC_ENVIRONMENT,
        ...server.http,
      });

      const wallet = createWalletClient({
        account,
        chain: mainnetChain,
        transport: http(),
      });

      return new ExchangeClient({
        transport,
        wallet: wallet,
      });
    } catch (error) {
      console.error('Failed to create agent wallet client:', error);
      return null;
    }
  }, [getAgents, address]);

  return {
    createUserClient,
    createL1Client,
  };
}
