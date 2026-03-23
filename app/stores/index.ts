import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  createDxdAuthSlice, DxdAuthSlice,
  createDxdSessionsSlice, DxdSessionsSlice,
  createDxdMetricsSlice, DxdMetricsSlice,
} from './slices/dxd';
import {
  createAuthSlice,
  createGlobalSettingsSlice,
  GlobalSettingsStoreState,
  AuthStoreState,
  createUserTradingDataSlice,
  UserTradingDataStoreState,
  createTradingDataSlice,
  TradingDataStoreState,
  createActionSlice,
  ActionStoreState,
  createOrderbookDataSlice,
  OrderbookDataStoreState,
  createVaultsSlice,
  VaultsStoreState,
  createAccountHistorySlice,
  AccountHistoryStoreState,
  createNotificationSlice,
  NotificationStoreState,
  createTradingPreferencesSlice,
  TradingPreferencesStoreState,
  createExpeditionDataSlice,
  ExpeditionDataStoreState,
} from './slices';

import { dynamicStorage } from './utils';

export const useGlobalStore = create<GlobalSettingsStoreState>()(
  persist(
    immer((...args) => ({
      ...createGlobalSettingsSlice(...args),
    })),
    {
      name: 'hotstuff-global-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useTradingPreferencesStore = create<TradingPreferencesStoreState>()(
  persist(
    immer((...args) => ({
      ...createTradingPreferencesSlice(...args),
    })),
    {
      name: 'hotstuff-trading-preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useAuthStore = create<AuthStoreState>()(
  persist(
    immer((...args) => ({
      ...createAuthSlice(...args),
    })),
    {
      name: 'hotstuff-auth',
      storage: createJSONStorage(() => dynamicStorage),
      // Ensure critical object fields are never null after hydration
      // This prevents "Cannot read properties of null" errors when accessing
      // userMetadata[address] during initial load or with corrupted storage
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<AuthStoreState>),
        // Always ensure these are objects, never null
        userMetadata: (persistedState as Partial<AuthStoreState>)?.userMetadata ?? {},
        agents: (persistedState as Partial<AuthStoreState>)?.agents ?? {},
        pendingAgents: (persistedState as Partial<AuthStoreState>)?.pendingAgents ?? {},
        legalTermsSigned: (persistedState as Partial<AuthStoreState>)?.legalTermsSigned ?? {},
      }),
    },
  ),
);

// Register store reloader for cross-tab sync
// if (typeof window !== 'undefined') {
//   dynamicStorage.registerStoreReloader('hotstuff-auth', () => {
//     useAuthStore.persist.rehydrate();
//   });
// }

export const useUserTradingDataStore = create<UserTradingDataStoreState>()(
  immer((...args) => ({
    ...createUserTradingDataSlice(...args),
  })),
);

export const useTradingDataStore = create<TradingDataStoreState>()(
  immer((...args) => ({
    ...createTradingDataSlice(...args),
  })),
);

export const useOrderbookDataStore = create<OrderbookDataStoreState>()(
  immer((...args) => ({
    ...createOrderbookDataSlice(...args),
  })),
);

export const useActionStore = create<ActionStoreState>()(
  immer((...args) => ({
    ...createActionSlice(...args),
  })),
);

export const useVaultsStore = create<VaultsStoreState>()(
  immer((...args) => ({
    ...createVaultsSlice(...args),
  })),
);

export const useAccountHistoryStore = create<AccountHistoryStoreState>()(
  immer((...args) => ({
    ...createAccountHistorySlice(...args),
  })),
);

export const useNotificationStore = create<NotificationStoreState>()(
  immer((...args) => ({
    ...createNotificationSlice(...args),
  })),
);

export const useExpeditionDataStore = create<ExpeditionDataStoreState>()(
  immer((...args) => ({
    ...createExpeditionDataSlice(...args),
  })),
);

// ─── DXD Market-Making Stores ─────────────────────────────────────────────────

export const useDxdAuthStore = create<DxdAuthSlice>()(
  persist(
    immer((...args) => ({ ...createDxdAuthSlice(...args) })),
    {
      name: 'dxd-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        dxdWalletAddress: state.dxdWalletAddress,
        agentAddress: state.agentAddress,
        agentName: state.agentName,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const useDxdSessionsStore = create<DxdSessionsSlice>()(
  immer((...args) => ({ ...createDxdSessionsSlice(...args) })),
);

export const useDxdMetricsStore = create<DxdMetricsSlice>()(
  immer((...args) => ({ ...createDxdMetricsSlice(...args) })),
);

export const migrateAuthData = (fromStorage: Storage, toStorage: Storage) => {
  try {
    const data = fromStorage.getItem('hotstuff-auth');
    if (data) {
      toStorage.setItem('hotstuff-auth', data);
      fromStorage.removeItem('hotstuff-auth');
    }
  } catch (error) {
    console.error('Failed to migrate auth data:', error);
  }
};
