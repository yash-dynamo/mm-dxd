import { useGlobalStore, useAuthStore, migrateAuthData } from '@/stores';
import { useState, useCallback } from 'react';
import { useLogout } from '@/providers/auth';

/**
 * useAuthActions
 * 
 * Provides auth-related actions. Logout is accessed via context
 * to avoid creating multiple useAuthController instances.
 */
export const useAuthActions = () => {
  const globalStore = useGlobalStore();
  const { setStatus } = useAuthStore();
  const [isLoading] = useState(false);
  
  // Get logout from context (provided by AuthProvider)
  const logout = useLogout();

  /**
   * Toggle trading connection persistence
   * Switches between localStorage (persistent) and sessionStorage (session-only)
   */
  const toggleTradingPersistence = useCallback(() => {
    const currentValue = globalStore.persistTradingConnection;
    const newValue = !currentValue;

    const currentAuth = useAuthStore.getState().status;

    if (newValue) {
      migrateAuthData(sessionStorage, localStorage);
    } else {
      migrateAuthData(localStorage, sessionStorage);
    }

    globalStore.setPersistTradingConnection(newValue);
    setStatus(currentAuth);
  }, [globalStore, setStatus]);

  return {
    toggleTradingPersistence,
    persistTradingConnection: globalStore.persistTradingConnection,
    isLoading,
    logout,
  };
};
