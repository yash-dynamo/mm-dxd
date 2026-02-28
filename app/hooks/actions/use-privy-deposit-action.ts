import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  encodeFunctionData,
} from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { useTradingDataStore, useAuthStore } from '@/stores';
import { SupportedCollateral } from '@/types/trading';
import { BRIDGE_ABI, ERC20_ABI } from '@/abi';
import { showToast } from '@/components/ui/toast';
import { env, isMainnet } from '@/config';
import { DEFAULT_MIN_AMOUNT } from '@/constants';

const POLLING_INTERVAL = 30000;
const TRANSACTION_TIMEOUT = 300000;

export const usePrivyDepositAction = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const supportedCollateral = useTradingDataStore((state) => state.supportedCollateral);
  const selectedAddress = useAuthStore((state) => state.address);

  const [processingTokens, setProcessingTokens] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingTokensRef = useRef<Set<string>>(new Set());

  // Find the Privy EMBEDDED wallet that matches the currently selected address
  // This ensures auto-bridge operates on the correct wallet when user has multiple Privy wallets
  const privyEmbeddedWallet = useMemo(() => {
    return wallets.find(
      (w) => w.walletClientType === 'privy' && w.address.toLowerCase() === selectedAddress?.toLowerCase()
    ) || wallets.find((w) => w.walletClientType === 'privy');
  }, [wallets, selectedAddress]);

  // Only consider this a Privy wallet flow if user has an embedded wallet
  // External wallet users (MetaMask, Phantom, etc.) should NOT trigger this auto-bridge
  const isPrivyEmbeddedWallet = authenticated && !!privyEmbeddedWallet;

  useEffect(() => {
    processingTokensRef.current = processingTokens;
  }, [processingTokens]);

  const { selectedChain, rpcUrl } = useMemo(() => {
    return {
      selectedChain: isMainnet ? mainnet : sepolia,
      rpcUrl: env.NEXT_PUBLIC_RPC_URL,
    };
  }, []);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: selectedChain,
        transport: http(rpcUrl, {
          timeout: 30000,
          retryCount: 2,
          retryDelay: 1000,
        }),
      }),
    [selectedChain, rpcUrl],
  );

  const getWalletClient = useCallback(async () => {
    // Use the embedded wallet specifically, not any external wallet
    if (!privyEmbeddedWallet) throw new Error('No Privy embedded wallet available');

    const provider = await privyEmbeddedWallet.getEthereumProvider();
    const [address] = (await provider.request({
      method: 'eth_accounts',
    })) as Address[];

    return {
      client: createWalletClient({
        account: address,
        chain: selectedChain,
        transport: custom(provider),
      }),
      address,
      provider,
    };
  }, [privyEmbeddedWallet, selectedChain]);

  const checkAndSwitchNetwork = useCallback(async () => {
    // Use the embedded wallet specifically
    if (!privyEmbeddedWallet) throw new Error('No Privy embedded wallet available');

    const provider = await privyEmbeddedWallet.getEthereumProvider();

    // Get current chain ID
    const currentChainId = (await provider.request({
      method: 'eth_chainId',
    })) as string;

    const currentChainIdNumber = parseInt(currentChainId, 16);
    const targetChainId = selectedChain.id;

    // If already on correct chain, return
    if (currentChainIdNumber === targetChainId) {
      return;
    }

    try {
      // Try to switch to the target chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // If the chain hasn't been added to the wallet, add it
      if (error.code === 4902 || error?.message?.includes('Unrecognized chain ID')) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: selectedChain.name,
              nativeCurrency: selectedChain.nativeCurrency,
              rpcUrls: [rpcUrl],
              blockExplorerUrls: selectedChain.blockExplorers?.default?.url
                ? [selectedChain.blockExplorers.default.url]
                : undefined,
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }, [privyEmbeddedWallet, selectedChain, rpcUrl]);

  const getBalance = useCallback(
    async (tokenSymbol: string): Promise<number> => {
      const token = supportedCollateral[tokenSymbol];
      if (!token?.bridge_by_chain?.[0]) throw new Error('Token not configured');

      // Ensure we're on the correct network before checking balance
      await checkAndSwitchNetwork();

      const { address } = await getWalletClient();

      const rawBalance = (await publicClient.readContract({
        address: token.bridge_by_chain[0].tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })) as bigint;

      return Number(rawBalance) / 10 ** token.decimals;
    },
    [supportedCollateral, publicClient, getWalletClient, checkAndSwitchNetwork],
  );

  const deposit = useCallback(
    async (tokenSymbol: string, amount: number) => {
      const token = supportedCollateral[tokenSymbol];
      if (!token?.bridge_by_chain?.[0]) throw new Error('Token not configured');

      await checkAndSwitchNetwork();

      const { client, address, provider } = await getWalletClient();
      const { tokenAddress, bridgeContractAddress } = token.bridge_by_chain[0];
      const amountInWei = parseUnits(amount.toString(), token.decimals);

      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [bridgeContractAddress as Address, amountInWei],
      });

      // Use sendTransaction with the embedded wallet's provider
      // This ensures we're using the correct wallet address
      const approveResult = await sendTransaction(
        {
          to: tokenAddress as `0x${string}`,
          data: approveData as `0x${string}`,
          chainId: selectedChain.id,
          from: address as `0x${string}`,
        },
        {
          sponsor: true,
          address: address as `0x${string}`,
        },
      );

      const approveHash = approveResult.hash;

      const approveReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveHash,
        timeout: TRANSACTION_TIMEOUT,
      });

      if (approveReceipt.status !== 'success') throw new Error('Approve failed');

      const depositData = encodeFunctionData({
        abi: BRIDGE_ABI,
        functionName: 'deposit',
        args: [tokenAddress as Address, amountInWei, address],
      });

      const bridgeResult = await sendTransaction(
        {
          to: bridgeContractAddress as `0x${string}`,
          data: depositData as `0x${string}`,
          chainId: selectedChain.id,
          from: address as `0x${string}`,
        },
        {
          sponsor: true,
          address: address as `0x${string}`,
        },
      );

      const bridgeHash = bridgeResult.hash;

      const bridgeReceipt = await publicClient.waitForTransactionReceipt({
        hash: bridgeHash,
        timeout: TRANSACTION_TIMEOUT,
      });

      if (bridgeReceipt.status !== 'success') throw new Error('Deposit failed');

      return { approveHash, bridgeHash };
    },
    [
      supportedCollateral,
      publicClient,
      getWalletClient,
      checkAndSwitchNetwork,
      sendTransaction,
      selectedChain.id,
    ],
  );

  const checkAndBridgeToken = useCallback(
    async (token: SupportedCollateral) => {
      // Use ref to check current processing state
      if (processingTokensRef.current.has(token.symbol)) return;

      try {
        const balance = await getBalance(token.symbol);
        console.log('balance', balance);

        if (balance < DEFAULT_MIN_AMOUNT) return;

        console.log(`Bridging ${balance} ${token.symbol}...`);

        setProcessingTokens((prev) => new Set(prev).add(token.symbol));

        await deposit(token.symbol, balance);

        showToast.success({
          message: `Successfully bridged ${balance} ${token.symbol}.`,
          description: 'Balance will update in 1-2 minutes.',
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Bridge error for ${token.symbol}:`, errorMsg);

        let displayMessage = errorMsg;
        if (errorMsg.includes('chain') || errorMsg.includes('network')) {
          displayMessage = `Please switch to ${selectedChain.name} to bridge ${token.symbol}`;
        } else if (errorMsg.includes('User rejected') || errorMsg.includes('user rejected')) {
          displayMessage = 'Chain switch was rejected. Please approve to continue.';
        }

        showToast.error({
          message: `Failed to bridge ${token.symbol}`,
          description: displayMessage,
        });
      } finally {
        setProcessingTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(token.symbol);
          return newSet;
        });
      }
    },
    [getBalance, deposit, selectedChain],
  );

  const pollBalances = useCallback(async () => {
    // Only poll for Privy EMBEDDED wallets
    if (!isPrivyEmbeddedWallet) return;

    const enabledTokens = Object.values(supportedCollateral).filter(
      (token) => token.bridge_by_chain?.[0]?.enabled,
    );

    if (enabledTokens.length === 0) return;

    console.log('Polling Privy embedded wallet balances...');
    await Promise.allSettled(enabledTokens.map(checkAndBridgeToken));
  }, [isPrivyEmbeddedWallet, supportedCollateral, checkAndBridgeToken]);

  useEffect(() => {
    // Only start polling for Privy EMBEDDED wallets
    if (!isPrivyEmbeddedWallet || Object.keys(supportedCollateral).length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('Stopped Privy polling');
      }
      return;
    }

    if (pollingIntervalRef.current) return;

    console.log('Started Privy embedded wallet polling');
    pollBalances();
    pollingIntervalRef.current = setInterval(pollBalances, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPrivyEmbeddedWallet, supportedCollateral, pollBalances]);

  return {
    isPolling: !!pollingIntervalRef.current,
    isPrivyWallet: isPrivyEmbeddedWallet,
    processingTokens: Array.from(processingTokens),
  };
};
