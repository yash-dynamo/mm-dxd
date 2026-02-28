import { StateCreator } from 'zustand';

export interface GlobalSettingsState {
  theme: 'light' | 'dark';
  language: string;
  persistTradingConnection: boolean;
  enableCustomizeLayout: boolean;
  skipOpenOrderConfirmation: boolean;
  enableFillNotifications: boolean;
  showMinimalOrderBook: boolean;
}

export interface GlobalSettingsActions {
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setPersistTradingConnection: (persist: boolean) => void;
  setEnableCustomizeLayout: (enable: boolean) => void;
  setSkipOpenOrderConfirmation: (skip: boolean) => void;
  setEnableFillNotifications: (enable: boolean) => void;
  setShowMinimalOrderBook: (show: boolean) => void;
}

export type GlobalSettingsStoreState = GlobalSettingsState & GlobalSettingsActions;

export const createGlobalSettingsSlice: StateCreator<GlobalSettingsStoreState> = (set) => ({
  theme: 'light',
  language: 'en',
  persistTradingConnection: true,
  enableCustomizeLayout: false,
  skipOpenOrderConfirmation: false,
  enableFillNotifications: false,
  showMinimalOrderBook: false,
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
  },

  setLanguage: (language: string) => {
    set({ language });
  },

  setPersistTradingConnection: (persist: boolean) => {
    set({ persistTradingConnection: persist });
  },

  setEnableCustomizeLayout: (enable: boolean) => {
    set({ enableCustomizeLayout: enable });
  },

  setSkipOpenOrderConfirmation: (skip: boolean) => {
    set({ skipOpenOrderConfirmation: skip });
  },

  setEnableFillNotifications: (enable: boolean) => {
    set({ enableFillNotifications: enable });
  },

  setShowMinimalOrderBook: (show: boolean) => {
    set({ showMinimalOrderBook: show });
  },
});
