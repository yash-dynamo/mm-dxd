/**
 * user-trading-data-slice
 *
 * Thin composer that wires together all user-trading sub-slices.
 * Each sub-slice lives in ./user-trading/ and owns a single concern.
 *
 * Sub-slices
 * ──────────
 *  positions   – positions record + leverage
 *  orders      – open orders, order/trade history, pending status orders
 *  account     – account summary, agent wallets, per-address account info
 *  fees        – user fees + fee-rate calculations
 *  collateral  – collateral transactions + funding payments
 *  vaults      – user vaults, sub-vaults, referral summary
 */
import { StateCreator } from 'zustand';

import {
  // Positions
  PositionsState,
  PositionsActions,
  createPositionsSlice,

  // Orders
  OrdersState,
  OrdersActions,
  createOrdersSlice,

  // Account
  AccountState,
  AccountActions,
  createAccountSlice,

  // Fees
  FeesState,
  FeesActions,
  createFeesSlice,

  // Collateral
  CollateralState,
  CollateralActions,
  createCollateralSlice,

  // Vaults
  UserVaultsState,
  UserVaultsActions,
  createUserVaultsSlice,
} from './user-trading';

// ─── Re-exports (backward compat) ────────────────────────────────────────────

export type { Leverage } from './user-trading';

// ─── Loading / Status State ───────────────────────────────────────────────────

const tableKeys = {
  orderHistory: false,
  tradeHistory: false,
  fundingPayments: false,
  positions: false,
  openOrders: false,
} as const;

type TableKey = keyof typeof tableKeys;

interface LoadingState {
  isLoading: boolean;
  success: boolean;
  error: string | null;
  loadingTable: Record<TableKey, boolean>;
  successTable: Record<TableKey, boolean>;
}

interface LoadingActions {
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingTable: (loading: boolean, key: TableKey) => void;
  setSuccessTable: (success: boolean, key: TableKey) => void;
}

// ─── Composed Types ───────────────────────────────────────────────────────────

export type UserTradingDataState = PositionsState &
  OrdersState &
  AccountState &
  FeesState &
  CollateralState &
  UserVaultsState &
  LoadingState;

export type UserTradingDataActions = PositionsActions &
  OrdersActions &
  AccountActions &
  FeesActions &
  CollateralActions &
  UserVaultsActions &
  LoadingActions & {
    /** Resets all user trading data back to initial state */
    clearUserTradingData: () => void;
  };

export type UserTradingDataStoreState = UserTradingDataState & UserTradingDataActions;

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createUserTradingDataSlice: StateCreator<UserTradingDataStoreState> = (
  set,
  get,
  store,
) => ({
  // Sub-slices
  ...createPositionsSlice(set as Parameters<typeof createPositionsSlice>[0], get, store),
  ...createOrdersSlice(set as Parameters<typeof createOrdersSlice>[0], get, store),
  ...createAccountSlice(set as Parameters<typeof createAccountSlice>[0], get, store),
  ...createFeesSlice(set as Parameters<typeof createFeesSlice>[0], get, store),
  ...createCollateralSlice(set as Parameters<typeof createCollateralSlice>[0], get, store),
  ...createUserVaultsSlice(set as Parameters<typeof createUserVaultsSlice>[0], get, store),

  // Shared loading / status state
  isLoading: false,
  success: false,
  error: null,
  loadingTable: tableKeys,
  successTable: tableKeys,

  setLoading: (loading) => set({ isLoading: loading }),
  setSuccess: (success) => set({ success }),
  setError: (error) => set({ error }),

  setLoadingTable: (loading, key) =>
    set({ loadingTable: { ...get().loadingTable, [key]: loading } }),

  setSuccessTable: (success, key) =>
    set({ successTable: { ...get().successTable, [key]: success } }),

  // These setters must also mark their successTable key so hooks know data has loaded.
  // The sub-slices are pure and unaware of this shared flag, so we override here.
  setOrderHistory: (orderHistory) => {
    const record = orderHistory.reduce(
      (acc, order) => { acc[order.order_id] = order; return acc; },
      {} as Record<string, import('@/types/trading').OrderHistory>,
    );
    set({ orderHistory: record, successTable: { ...get().successTable, orderHistory: true } });
  },

  setTradeHistory: (tradeHistory) => {
    const record = tradeHistory.reverse().reduce(
      (acc, trade) => { acc[trade.trade_id] = trade; return acc; },
      {} as Record<string, import('@/types/trading').TradeHistory>,
    );
    set({ tradeHistory: record, successTable: { ...get().successTable, tradeHistory: true }, success: true });
  },

  // Delegates to every sub-slice clear
  clearUserTradingData: () => {
    get().clearAccountSummary();
    get().clearUserFees();
    get().clearPositions();
    get().clearOpenOrders();
    get().clearOrderHistory();
    get().clearTradeHistory();
    get().clearCollateralTransactions();
    get().clearFundingPayments();
    get().clearLeverage();
    get().clearVaults();
    get().clearSubVaults();
    get().clearAgentWallets();
    get().clearReferralSummary();
    get().clearAccountInfo();
  },
});
