'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useAuthStore, useActionStore, useGlobalStore, useUserTradingDataStore } from '@/stores';
import { wagmiConfig, appKit } from '@/config/wallet';
import { Address } from 'viem';
import type { Connector } from 'wagmi';
import { normalizeAddress } from '@/utils/formatting';

// Auth source types
type AuthSource = 'wagmi' | 'privy' | 'none';

// Controller state
interface AuthControllerState {
  isInitialized: boolean;
  activeSource: AuthSource;
  address: Address | null;
}

/**
 * Unified Auth Controller
 * 
 * Single source of truth for authentication state.
 * Coordinates between Wagmi (external wallets) and Privy (social login/embedded wallets).
 * 
 * Responsibilities:
 * - Sync wallet connection state to auth store
 * - Handle disconnection
 * - Provide unified logout function
 * 
 * NOT responsible for:
 * - Managing agents (handled by enable-trading flow)
 * - Managing trading status transitions (handled by various flows)
 * 
 * Priority: Wagmi external wallet > Privy embedded wallet
 */
export function useAuthController() {
  // Track if we're mounted (client-side)
  const [isMounted, setIsMounted] = useState(false);
  
  // Track the last synced address to prevent duplicate updates
  const lastSyncedAddressRef = useRef<Address | null>(null);
  const hasInitializedRef = useRef(false);
  const hasLoggedOutRef = useRef(false);

  // Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Wagmi state
  const { isConnected: wagmiConnected, address: wagmiAddress, isReconnecting } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Privy state
  const { authenticated: privyAuthenticated, ready: privyReady, logout: privyLogout, user } = usePrivy();

  // Get all Privy embedded wallet addresses for this user
  const privyWalletAddresses = useMemo(() => {
    if (!privyAuthenticated || !user?.linkedAccounts) return [];
    return user.linkedAccounts
      .filter(
        (account): account is { type: 'wallet'; address: string; walletClientType: string } & typeof account =>
          account.type === 'wallet' &&
          'walletClientType' in account &&
          (account as any).walletClientType === 'privy',
      )
      .map((w) => w.address.toLowerCase());
  }, [privyAuthenticated, user?.linkedAccounts]);

  // Derive Privy wallet address
  // If the user has previously selected a different Privy wallet (stored in auth store),
  // respect that selection instead of always using the default wallet
  const privyAddress = useMemo(() => {
    if (!privyAuthenticated) return null;

    // Check if the currently stored address is one of this user's Privy wallets
    const currentStoreAddress = useAuthStore.getState().address;
    if (
      currentStoreAddress &&
      currentStoreAddress !== '0x0000000000000000000000000000000000000000' &&
      privyWalletAddresses.includes(currentStoreAddress.toLowerCase())
    ) {
      return currentStoreAddress;
    }

    // Fall back to default wallet
    if (user?.wallet?.address) {
      return normalizeAddress(user.wallet.address as Address);
    }
    return null;
  }, [privyAuthenticated, user?.wallet?.address, privyWalletAddresses]);

  // Determine if systems are ready
  const isWagmiReady = !isReconnecting;
  const isPrivyReady = privyReady;
  const isFullyReady = isWagmiReady && isPrivyReady && isMounted;

  // Determine active auth source and address
  const controllerState = useMemo((): AuthControllerState => {
    if (!isFullyReady) {
      return { isInitialized: false, activeSource: 'none', address: null };
    }

    // Priority: Wagmi (external wallet) > Privy (embedded wallet)
    // Normalize Wagmi address (some wallets like Rabby may return lowercase)
    if (wagmiConnected && wagmiAddress) {
      return { isInitialized: true, activeSource: 'wagmi', address: normalizeAddress(wagmiAddress) };
    }

    if (privyAuthenticated && privyAddress) {
      return { isInitialized: true, activeSource: 'privy', address: privyAddress };
    }

    return { isInitialized: true, activeSource: 'none', address: null };
  }, [isFullyReady, wagmiConnected, wagmiAddress, privyAuthenticated, privyAddress]);

  // Sync auth state to store - only handles connection/disconnection
  useEffect(() => {
    if (!isMounted || !controllerState.isInitialized) {
      return;
    }

    const { address } = controllerState;

    // Skip if we've already synced this address
    if (lastSyncedAddressRef.current === address && hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    if (address) {
      // Only update if address changed (new connection or wallet switch)
      if (lastSyncedAddressRef.current !== address) {
        lastSyncedAddressRef.current = address;
        hasLoggedOutRef.current = false;
        
        // Close connect-wallet modal if open (user just connected)
        const currentModal = useActionStore.getState().modal;
        if (currentModal === 'connect-wallet') {
          useActionStore.getState().setModal(null);
        }
        
        // updateStatusOnConnect will check for existing agents and set appropriate status
        useAuthStore.getState().updateStatusOnConnect(address);
      }
    } else {
      // No active connection - but check if we have a stored agent (QR login case)
      const authState = useAuthStore.getState();
      const hasStoredAgent = 
        authState.address !== '0x0000000000000000000000000000000000000000' &&
        authState.agents[authState.address];

      if (hasStoredAgent) {
        // Keep the session alive for QR-based logins
        lastSyncedAddressRef.current = null;
        return;
      }

      // No connection and no stored agent - user is logged out
      if (!hasLoggedOutRef.current) {
        lastSyncedAddressRef.current = null;
        hasLoggedOutRef.current = true;
        useAuthStore.getState().setAddress('0x0000000000000000000000000000000000000000' as Address);
        useAuthStore.getState().setStatus('disconnected');
      }
    }
  }, [isMounted, controllerState]);

  // Logout function - single path for all auth sources
  const logout = useCallback(async () => {
    if (!isMounted) return;
    
    const { activeSource } = controllerState;

    try {
      // Disconnect from AppKit/Reown if it exists
      if (appKit) {
        try {
          await appKit.disconnect();
        } catch {
          // AppKit might not be connected - ignore
        }
      }

      // Disconnect based on active source
      if (activeSource === 'wagmi' || wagmiConnected) {
        // Disconnect all Wagmi connections
        const connections = Array.from(wagmiConfig.state.connections.values());
        for (const connection of connections) {
          try {
            await wagmiDisconnect({ connector: connection.connector as Connector });
          } catch (err) {
            console.error(`Failed to disconnect ${connection.connector.id}:`, err);
          }
        }
        wagmiConfig.state.connections.clear();

        if (wagmiConfig.storage) {
          await wagmiConfig.storage.removeItem('recentConnectorId');
        }
      }

      if (activeSource === 'privy' || privyAuthenticated) {
        try {
          await privyLogout();
        } catch (err) {
          console.error('Failed to logout from Privy:', err);
        }
      }

      // Clear stores
      const persistConnection = useGlobalStore.getState().persistTradingConnection;
      if (persistConnection) {
        useAuthStore.getState().clearAuth();
      } else {
        useAuthStore.getState().clearPersistedAuth();
      }
      useUserTradingDataStore.getState().clearUserTradingData();

      // Reset refs
      lastSyncedAddressRef.current = null;
      hasLoggedOutRef.current = true;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, [
    isMounted,
    controllerState,
    wagmiConnected,
    wagmiDisconnect,
    privyAuthenticated,
    privyLogout,
  ]);

  return {
    // State
    isInitialized: controllerState.isInitialized,
    isFullyReady,
    activeSource: controllerState.activeSource,
    address: controllerState.address,
    
    // Derived state
    isWagmiReady,
    isPrivyReady,
    isConnected: controllerState.address !== null,
    
    // Actions
    logout,
  };
}

// Export types
export type { AuthSource, AuthControllerState };
