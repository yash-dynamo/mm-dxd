import { BRIDGE_ABI, ERC20_ABI } from '@/abi';
import { useCallback, useMemo } from 'react';
import { Address, createPublicClient, http, TransactionReceipt } from 'viem';
import { parseUnits } from 'viem/utils';
import { sepolia, mainnet } from 'viem/chains';
import { useAccount, useWriteContract, useWalletClient, useSwitchChain } from 'wagmi';
import { sepolia as sepoliaWagmi, mainnet as mainnetWagmi } from '@wagmi/core/chains';
import { showToast } from '@/components/ui/toast';
import { useTradingDataStore } from '@/stores';
import { env, isMainnet } from '@/config';

const RPC_ENDPOINTS = {
  sepolia: [
    env.NEXT_PUBLIC_RPC_URL,
    'https://0xrpc.io/sep',
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ],
  mainnet: [
    env.NEXT_PUBLIC_RPC_URL,
    'https://0xrpc.io/main',
    'https://ethereum-mainnet-rpc.publicnode.com',
    'https://mainnet.drpc.org',
  ],
};

const TRANSACTION_TIMEOUT = 300000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

export const useDepositActions = () => {
  const { address, chain: currentChain } = useAccount();
  const { data: walletClient } = useWalletClient();
  // Use reactive selector instead of getter
  const supportedCollateralState = useTradingDataStore((state) => state.supportedCollateral);
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();



  const selectedChain = useMemo(() => {
    return isMainnet ? mainnet : sepolia;
  }, [isMainnet]);

  const selectedWagmiChain = useMemo(() => {
    return isMainnet ? mainnetWagmi : sepoliaWagmi;
  }, [isMainnet]);

  const clients = useMemo(() => {
    const rpcUrls =
      isMainnet
        ? RPC_ENDPOINTS.mainnet
        : RPC_ENDPOINTS.sepolia;

    return rpcUrls.map((url) =>
      createPublicClient({
        chain: selectedChain,
        transport: http(url, {
          timeout: 30000,
          retryCount: 2,
          retryDelay: 1000,
        }),
      }),
    );
  }, [selectedChain]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForTransactionReceiptWithRetry = useCallback(
    async (
      hash: `0x${string}`,
      timeoutMs: number = TRANSACTION_TIMEOUT,
    ): Promise<TransactionReceipt> => {
      const startTime = Date.now();
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
          const currentClient = clients[clientIndex];

          try {
            console.log(
              `Attempt ${attempt + 1}/${MAX_RETRIES}, Client ${clientIndex + 1}/${clients.length
              }: Waiting for receipt ${hash}`,
            );

            if (Date.now() - startTime > timeoutMs) {
              throw new Error(`Transaction receipt timeout after ${timeoutMs}ms`);
            }

            const receipt = await Promise.race([
              currentClient.waitForTransactionReceipt({
                hash,
                timeout: Math.min(60000, timeoutMs - (Date.now() - startTime)), // Max 1 minute per attempt
              }),
              // Custom timeout
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Custom timeout')), 60000),
              ),
            ]);

            return receipt;
          } catch (error: unknown) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            lastError = errorObj;
            const isTimeout =
              errorObj.message?.includes('timeout') ||
              errorObj.message?.includes('408') ||
              errorObj.message?.includes('Request timeout');

            console.warn(`Client ${clientIndex + 1} failed:`, errorObj.message);

            if (isTimeout && clientIndex < clients.length - 1) {
              continue;
            }

            break;
          }
        }

        // If we've tried all clients and still failed, wait before next attempt
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`Waiting ${delay}ms before next attempt...`);
          await sleep(delay);
        }
      }

      throw new Error(
        `Failed to get transaction receipt after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'
        }`,
      );
    },
    [clients],
  );

  const getBalance = useCallback(
    async (token: string) => {
      let lastError: Error | null = null;

      for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
        try {
          const currentClient = clients[clientIndex];
          const raw_balance = await currentClient.readContract({
            address: supportedCollateralState[token]?.bridge_by_chain[0].tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });

          const balance =
            Number(raw_balance) / 10 ** Number(supportedCollateralState[token]?.decimals ?? 6);

          return balance;
        } catch (error: unknown) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          lastError = errorObj;
          console.warn(`Client ${clientIndex + 1} failed for balance check:`, errorObj.message);
          continue;
        }
      }

      throw new Error(
        `Failed to get balance after trying all RPC endpoints. Last error: ${lastError?.message || 'Unknown error'
        }`,
      );
    },
    [address, clients, supportedCollateralState],
  );

  const checkAndSwitchNetwork = useCallback(async () => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    // Check if user is on the correct network
    if (currentChain?.id !== selectedWagmiChain.id) {
      try {
        await switchChainAsync({ chainId: selectedWagmiChain.id });
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to switch chain:', errorObj);
        throw new Error(`Failed to switch to ${selectedWagmiChain.name}`);
      }
    }
  }, [walletClient, currentChain, selectedWagmiChain, switchChainAsync]);

  const isCorrectNetwork = useCallback(() => {
    return currentChain?.id === selectedWagmiChain.id;
  }, [currentChain, selectedWagmiChain]);

  const deposit = useCallback(
    async (tokenSymbol: string, amount: number) => {
      try {
        const token = supportedCollateralState[tokenSymbol];

        if (!token) {
          throw new Error(`Token ${tokenSymbol} not found`);
        }

        // Check and switch network if needed
        await checkAndSwitchNetwork();

        const amountInWei = parseUnits(amount.toString(), token.decimals ?? 6);

        const approveTxHash = await writeContractAsync({
          address: token.bridge_by_chain[0].tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [token.bridge_by_chain[0].bridgeContractAddress as Address, amountInWei],
          gas: BigInt(100000), // Explicit gas limit to avoid estimation issues
        });

        const approveReceipt = await waitForTransactionReceiptWithRetry(approveTxHash);

        if (approveReceipt.status !== 'success') {
          throw new Error('Approve transaction failed');
        }

        const bridgeTxHash = await writeContractAsync({
          address: token.bridge_by_chain[0].bridgeContractAddress as Address,
          abi: BRIDGE_ABI,
          functionName: 'deposit',
          args: [token.bridge_by_chain[0].tokenAddress as Address, amountInWei, address as Address],
        });

        const bridgeReceipt = await waitForTransactionReceiptWithRetry(bridgeTxHash);

        if (bridgeReceipt.status !== 'success') {
          throw new Error('Deposit transaction failed');
        }

        showToast.success({
          message: 'Deposit successful!',
          description: 'Your balance will update in 1-2 minutes.',
        });

        return {
          approveHash: approveTxHash,
          depositHash: bridgeTxHash,
          approveReceipt,
          depositReceipt: bridgeReceipt,
        };
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Deposit failed:', errorObj);

        if (errorObj.message?.includes('timeout') || errorObj.message?.includes('408')) {
          throw new Error(
            'Transaction is taking longer than expected due to network congestion. Your transaction may still be processing on the blockchain (can take up to 5 minutes). Please check your transaction on a block explorer.',
          );
        } else if (errorObj.message?.includes('insufficient funds')) {
          throw new Error(
            'Insufficient funds for gas fees. Please ensure you have enough ETH in your wallet.',
          );
        } else if (errorObj.message?.includes('User rejected')) {
          throw new Error('Transaction was rejected by user.');
        } else if (errorObj.message?.includes('nonce')) {
          throw new Error('Transaction nonce issue. Please try again.');
        } else {
          throw new Error(`Deposit failed: ${errorObj.message || 'Unknown error occurred'}`);
        }
      }
    },
    [
      writeContractAsync,
      address,
      checkAndSwitchNetwork,
      waitForTransactionReceiptWithRetry,
      supportedCollateralState,
    ],
  );

  return {
    getBalance,
    deposit,
    isCorrectNetwork,
    checkAndSwitchNetwork,
    isMainnet,
    selectedChain: selectedWagmiChain,
  };
};
