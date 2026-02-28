import { StateCreator } from 'zustand';

export type orderTypePersist = 'limit' | 'market';
export type TimeInForce = 'GTC' | 'IOC';

export interface TradingPreferencesState {
  orderTypePersist: orderTypePersist;
  favoriteInstruments: string[];
  usersTableTab: string;
  positionsAssetFilter: string;
  positionsTypeFilter: string;
  openOrdersAssetFilter: string;
  openOrdersTypeFilter: string;
  orderHistoryAssetFilter: string;
  orderHistoryTypeFilter: string;
  tradeHistoryAssetFilter: string;
  tradeHistoryTypeFilter: string;
  reduceOnlyPersist: boolean;
  postOnlyPersist: boolean;
  timeInForcePersist: TimeInForce;
  chartType: 'index' | 'mark' | 'ltp';
  orderSizeMode: 'quote' | 'base';
  maxSlippage: number;
}

export interface TradingPreferencesActions {
  setorderTypePersist: (orderType: orderTypePersist) => void;
  addFavoriteInstrument: (instrument: string) => void;
  removeFavoriteInstrument: (instrument: string) => void;
  setFavoriteInstruments: (instruments: string[]) => void;
  setUsersTableTab: (tab: string) => void;
  setPositionsAssetFilter: (filter: string) => void;
  setPositionsTypeFilter: (filter: string) => void;
  setOpenOrdersAssetFilter: (filter: string) => void;
  setOpenOrdersTypeFilter: (filter: string) => void;
  setOrderHistoryAssetFilter: (filter: string) => void;
  setOrderHistoryTypeFilter: (filter: string) => void;
  setTradeHistoryAssetFilter: (filter: string) => void;
  setTradeHistoryTypeFilter: (filter: string) => void;
  setreduceOnlyPersist: (value: boolean) => void;
  setpostOnlyPersist: (value: boolean) => void;
  settimeInForcePersist: (value: TimeInForce) => void;
  setChartType: (chartType: 'index' | 'mark' | 'ltp') => void;
  setOrderSizeMode: (mode: 'quote' | 'base') => void;
  setMaxSlippage: (slippage: number) => void;
}

export type TradingPreferencesStoreState = TradingPreferencesState & TradingPreferencesActions;

export const createTradingPreferencesSlice: StateCreator<TradingPreferencesStoreState> = (set) => ({
  orderTypePersist: 'market',
  favoriteInstruments: [],
  usersTableTab: 'balances',
  positionsAssetFilter: 'all',
  positionsTypeFilter: 'all',
  openOrdersAssetFilter: 'all',
  openOrdersTypeFilter: 'all',
  orderHistoryAssetFilter: 'all',
  orderHistoryTypeFilter: 'all',
  tradeHistoryAssetFilter: 'all',
  tradeHistoryTypeFilter: 'all',
  reduceOnlyPersist: false,
  postOnlyPersist: false,
  timeInForcePersist: 'GTC',
  chartType: 'mark',
  orderSizeMode: 'quote',

  maxSlippage: 5,

  setorderTypePersist: (orderType: orderTypePersist) => {
    set({ orderTypePersist: orderType });
  },

  addFavoriteInstrument: (instrument: string) => {
    set((state) => ({
      favoriteInstruments: state.favoriteInstruments.includes(instrument)
        ? state.favoriteInstruments
        : [...state.favoriteInstruments, instrument],
    }));
  },

  removeFavoriteInstrument: (instrument: string) => {
    set((state) => ({
      favoriteInstruments: state.favoriteInstruments.filter((i) => i !== instrument),
    }));
  },

  setFavoriteInstruments: (instruments: string[]) => {
    set({ favoriteInstruments: instruments });
  },

  setUsersTableTab: (tab: string) => {
    set({ usersTableTab: tab });
  },

  setPositionsAssetFilter: (filter: string) => {
    set({ positionsAssetFilter: filter });
  },

  setPositionsTypeFilter: (filter: string) => {
    set({ positionsTypeFilter: filter });
  },

  setOpenOrdersAssetFilter: (filter: string) => {
    set({ openOrdersAssetFilter: filter });
  },

  setOpenOrdersTypeFilter: (filter: string) => {
    set({ openOrdersTypeFilter: filter });
  },

  setOrderHistoryAssetFilter: (filter: string) => {
    set({ orderHistoryAssetFilter: filter });
  },

  setOrderHistoryTypeFilter: (filter: string) => {
    set({ orderHistoryTypeFilter: filter });
  },

  setTradeHistoryAssetFilter: (filter: string) => {
    set({ tradeHistoryAssetFilter: filter });
  },

  setTradeHistoryTypeFilter: (filter: string) => {
    set({ tradeHistoryTypeFilter: filter });
  },

  setreduceOnlyPersist: (value: boolean) => {
    set({ reduceOnlyPersist: value });
  },

  setpostOnlyPersist: (value: boolean) => {
    set({ postOnlyPersist: value });
  },

  settimeInForcePersist: (value: TimeInForce) => {
    set({ timeInForcePersist: value });
  },

  setChartType: (chartType: 'index' | 'mark' | 'ltp') => {
    set({ chartType });
  },

  setOrderSizeMode: (mode: 'quote' | 'base') => {
    set({ orderSizeMode: mode });
  },

  setMaxSlippage: (slippage: number) => {
    set({ maxSlippage: slippage });
  },
});
