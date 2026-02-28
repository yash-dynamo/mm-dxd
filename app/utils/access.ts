'use client';

import { useCountdownStatus } from '@/hooks';
import { useAuthStore } from '@/stores';
import { isMainnet } from '@/config/env';
import { useAuthController } from '@/hooks/use-auth-controller';

interface AccessPlatformResult {
  canAccess: boolean;
  isLoading: boolean;
}

/**
 * Hook to determine if a user can access the platform.
 * Access is granted if:
 * - Countdown is not active AND user is whitelisted, OR
 * - Environment is not mainnet (dev/staging environments bypass the check)
 * 
 * Also returns loading state to prevent premature redirects.
 * Loading is true when:
 * - Wallet connection status is not yet determined
 * - User metadata is still being fetched (for connected users)
 * - We have persisted auth data but wallet hasn't reconnected yet
 */
export const useCanAccessPlatform = (): AccessPlatformResult => {
  const { isActive: isCountdownActive } = useCountdownStatus();
  const { userMetadata: userMetadataRecord, address: storedAddress, isUserMetadataLoading, status } = useAuthStore();
  const { isFullyReady, isConnected, isWagmiReady, isPrivyReady } = useAuthController();
  
  const userMetadata = userMetadataRecord?.[storedAddress];
  const isWhitelisted = userMetadata?.is_whitelisted === true;
  
  // Check if we have persisted auth data (user was previously connected)
  const hasPersistedAuth = storedAddress && storedAddress !== '0x0000000000000000000000000000000000000000';
  
  // CRITICAL: Check if ANY address in the persisted store has whitelist status
  // This handles the case where storedAddress temporarily resets to 0x0 during wallet detection
  const hasAnyPersistedWhitelist = Object.values(userMetadataRecord).some(
    (metadata) => metadata?.is_whitelisted === true
  );

  // Not mainnet = always can access, no loading
  if (!isMainnet) {
    return { canAccess: true, isLoading: false };
  }

  // Wait for wallet systems to initialize
  if (!isFullyReady) {
    return { canAccess: false, isLoading: true };
  }

  // KEY FIX: If we have ANY persisted whitelisted data (for any address), grant access.
  // This handles the case where the current storedAddress temporarily resets to 0x0 
  // during wallet detection, but we still have whitelist data stored for a real address.
  // This prevents the redirect dance during wallet reconnection.
  if (hasAnyPersistedWhitelist && !isCountdownActive) {
    return { canAccess: true, isLoading: false };
  }

  // If we have persisted auth (user was connected before) but no whitelist data yet,
  // wait for the wallet to reconnect and metadata to load
  if (hasPersistedAuth && !isConnected) {
    return { canAccess: false, isLoading: true };
  }

  // If connected, wait for metadata to load before making access decision
  if (isConnected && isUserMetadataLoading) {
    return { canAccess: false, isLoading: true };
  }

  // If disconnected with no persisted auth, they can't access
  if (!isConnected) {
    return { canAccess: false, isLoading: false };
  }

  // All data loaded - make the access decision
  const canAccess = !isCountdownActive && isWhitelisted;
  return { canAccess, isLoading: false };
};
