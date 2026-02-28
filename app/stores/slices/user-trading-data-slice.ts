import { StateCreator } from 'zustand';
import {
  Position,
  Order,
  OrderHistory,
  TradeHistory,
  AccountSummary,
  UserFees,
  AgentWallet,
  CollateralTransaction,
  FundingPayment,
  IReferralSummary,
  IAccountInfo,
} from '@/types/trading';
// TradingType was previously imported from a product UI component.
// Defined here directly so the store works without the product pages.
type TradingType = 'perps' | 'spot';
import { SubVault, Vault } from '@/types/vault';
import { Address } from 'viem';

export interface Leverage {
  leverage: number;
  margin_mode: string;
}

const userTradingDataTableStates = {
  orderHistory: false,
  tradeHistory: false,
  fundingPayments: false,
  positions: false,
  openOrders: false,
} as const;

export interface UserTradingDataState {
  agentWallets: AgentWallet[];
  accountSummary: AccountSummary;
  userFees: UserFees;
  positions: Record<string, Position>;
  openOrders: Record<string, Order>;
  orderHistory: Record<string, OrderHistory>;
  tradeHistory: Record<string, TradeHistory>;
  leverage: Record<string, Leverage>;
  collateralTransactions: CollateralTransaction[];
  fundingPayments: FundingPayment[];
  vaults: Record<string, Vault>;
  subVaults: Record<string, SubVault>;
  isLoading: boolean;
  success: boolean;
  error: string | null;
  loadingTable: Record<keyof typeof userTradingDataTableStates, boolean>;
  successTable: Record<keyof typeof userTradingDataTableStates, boolean>;

  referralSummary: Record<Address, IReferralSummary>;
  accountInfo: Record<Address, IAccountInfo | null>;
  pendingStatusOrders: Array<string>;
}

export interface UserTradingDataActions {
  // Agent Wallets
  setAgentWallets: (agentWallets: AgentWallet[]) => void;
  clearAgentWallets: () => void;

  // Positions
  setPositions: (positions: Position[]) => void;
  updatePositions: (positions: Position[]) => void;
  updatePosition: (key: string, position: Position) => void;
  clearPositions: () => void;
  deletePosition: (instrument_id: string, position_side: string) => void;

  // Open Orders
  setOpenOrders: (openOrders: Order[]) => void;
  updateOpenOrders: (order: Order) => void;
  clearOpenOrders: () => void;
  getTPSLOrders: () => Order[];

  // Order History
  setOrderHistory: (orderHistory: OrderHistory[]) => void;
  updateOrderHistory: (orderHistory: OrderHistory) => void;
  clearOrderHistory: () => void;

  // Trade History
  setTradeHistory: (tradeHistory: TradeHistory[]) => void;
  updateTradeHistory: (tradeHistory: TradeHistory) => void;
  clearTradeHistory: () => void;
  getOrderFromTradeHistory: (orderId: string) => TradeHistory | undefined;

  // Account Summary
  setAccountSummary: (accountSummary: AccountSummary) => void;
  updateAccountSummary: (accountSummary: AccountSummary) => void;
  clearAccountSummary: () => void;
  getUserVaultShares: (
    vaultAddress: string,
    accountSummary: AccountSummary,
  ) => {
    withdrawable_shares: string;
    total_shares: string;
    amount: string;
  };

  // User Fees
  setUserFees: (userFees: UserFees) => void;
  updateUserFees: (userFees: UserFees) => void;
  clearUserFees: () => void;

  // Leverage
  setLeverage: (instrument: string, leverage: Leverage) => void;
  updateLeverage: (instrument: string, leverage: Leverage) => void;
  clearLeverage: () => void;

  // Collateral Transactions
  setCollateralTransactions: (collateralTransactions: CollateralTransaction[]) => void;
  clearCollateralTransactions: () => void;


  // Funding Payments
  setFundingPayments: (fundingPayments: FundingPayment[]) => void;
  updateFundingPayments: (fundingPayments: FundingPayment[]) => void;
  clearFundingPayments: () => void;

  // Fee Rates
  getFeeRatesRaw: (
    tradingType: TradingType,
    userFees: UserFees,
    isStableSpot: boolean,
  ) => {
    makerRate: number;
    takerRate: number;
  };
  getFeeRates: (tradingType: TradingType, userFees: UserFees, isStableSpot: boolean) => string;

  // Loading
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingTable: (loading: boolean, subItems: keyof typeof userTradingDataTableStates) => void;
  setSuccessTable: (success: boolean, subItems: keyof typeof userTradingDataTableStates) => void;

  //Vaults
  setVaults: (vaults: Vault[]) => void;
  getVault: (vaultAddress: string) => Vault;
  clearVaults: () => void;

  //S
  setSubVaults: (subVaults: SubVault[]) => void;
  clearSubVaults: () => void;

  setReferralSummary: (referralSummary: IReferralSummary) => void;
  clearReferralSummary: () => void;

  // Account Info
  setAccountInfo: (address: Address, accountInfo: IAccountInfo | null) => void;
  clearAccountInfo: () => void;

  clearUserTradingData: () => void;

  updatePendingStatusOrders: (cloid: string | Array<string>) => void;
  deletePendingStatusOrder: (cloid: string) => void;
  clearPendingStatusOrders: () => void;
}

export type UserTradingDataStoreState = UserTradingDataState & UserTradingDataActions;

export const createUserTradingDataSlice: StateCreator<UserTradingDataStoreState> = (set, get) => ({
  agentWallets: [],
  positions: {},
  openOrders: {},
  orderHistory: {},
  tradeHistory: {},
  collateralTransactions: [],
  fundingPayments: [],
  pendingStatusOrders: [],
  isLoading: false,
  success: false,
  error: null,
  loadingTable: userTradingDataTableStates,
  successTable: userTradingDataTableStates,
  accountSummary: {
    address: '',
    margin_mode: 'isolated',
    multi_asset_mode: false,
    hedge_mode: false,
    spot_collateral: {},
    collateral: {},
    staked_collateral: 0,
    perp_positions: {},
    leverage_override: {},
    initial_margin_utilization: 0,
    maintenance_margin_utilization: 0,
    upnl: 0,
    total_account_equity: 0,
    margin_balance: 0,
    initial_margin: 0,
    maintenance_margin: 0,
    total_volume: 0,
    total_pnl: 0,
    vault_balances: {},
    available_balance: 0,
    transfer_margin_req: 0,
    max_drawdown: 0,
    spot_account_equity: 0,
    derivative_account_equity: 0,
    spot_volume: 0,
  },
  userFees: {
    account: '',
    spot_volume_14d: '0',
    spot_volume_30d: '0',
    stable_spot_volume_14d: '0',
    stable_spot_volume_30d: '0',
    perp_volume_14d: '0',
    perp_volume_30d: '0',
    option_volume_14d: '0',
    option_volume_30d: '0',
    total_volume_threshold: 0,
    perp_maker_fee_rate: 0,
    perp_taker_fee_rate: 0,
    spot_maker_fee_rate: 0,
    spot_taker_fee_rate: 0,
    stable_spot_maker_fee_rate: 0,
    stable_spot_taker_fee_rate: 0,
    option_maker_fee_rate: 0,
    option_taker_fee_rate: 0,
  },
  leverage: {},
  vaults: {},
  subVaults: {},
  referralSummary: {},
  accountInfo: {},


  deletePosition: (instrument_id: string, position_side: string) => {
    const currentPositions = { ...get().positions };
    delete currentPositions[`${instrument_id}:${position_side}`];
    set({ positions: currentPositions });
  },

  getTPSLOrders: (): Order[] => {
    const { openOrders } = get();
    return Object.values(openOrders).filter((order) => order.tpsl !== '');
  },

  setLoadingTable: (loading: boolean, subItems: keyof typeof userTradingDataTableStates) => {
    set({ loadingTable: { ...get().loadingTable, [subItems]: loading } });
  },

  setSuccessTable: (success: boolean, subItems: keyof typeof userTradingDataTableStates) => {
    set({ successTable: { ...get().successTable, [subItems]: success } });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSuccess: (success: boolean) => {
    set({ success: success });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setAgentWallets: (agentWallets: AgentWallet[]) => {
    set({ agentWallets });
  },

  clearAgentWallets: () => {
    set({ agentWallets: [] });
  },

  setAccountSummary: (accountSummary: AccountSummary) => {
    set({ accountSummary });
  },

  updateAccountSummary: (accountSummary: AccountSummary) => {
    set({ accountSummary: { ...get().accountSummary, ...accountSummary } });
  },

  clearAccountSummary: () => {
    set({
      accountSummary: {
        address: '',
        margin_mode: 'isolated',
        multi_asset_mode: false,
        hedge_mode: false,
        spot_collateral: {},
        collateral: {},
        staked_collateral: 0,
        perp_positions: {},
        leverage_override: {},
        initial_margin_utilization: 0,
        maintenance_margin_utilization: 0,
        upnl: 0,
        total_account_equity: 0,
        margin_balance: 0,
        initial_margin: 0,
        maintenance_margin: 0,
        total_volume: 0,
        total_pnl: 0,
        vault_balances: {},
        available_balance: 0,
        transfer_margin_req: 0,
        max_drawdown: 0,
        spot_account_equity: 0,
        derivative_account_equity: 0,
        spot_volume: 0,
      },
    });
  },

  getUserVaultShares: (
    vaultAddress: string,
    accountSummary: AccountSummary,
  ): { withdrawable_shares: string; total_shares: string; amount: string } => {
    return {
      withdrawable_shares:
        accountSummary?.vault_balances?.[vaultAddress]?.withdrawable_shares?.toString() || '0',
      total_shares: accountSummary?.vault_balances?.[vaultAddress]?.total_shares?.toString() || '0',
      amount: accountSummary?.vault_balances?.[vaultAddress]?.amount?.toString() || '0',
    };
  },

  getFeeRatesRaw(tradingType: TradingType, userFees: UserFees, isStableSpot: boolean) {
    if (!userFees.account) {
      return {
        makerRate: 0,
        takerRate: 0,
      };
    }
    if (tradingType === 'perps') {
      return {
        makerRate: userFees.perp_maker_fee_rate * 100,
        takerRate: userFees.perp_taker_fee_rate * 100,
      };
    } else {
      if (isStableSpot) {
        return {
          makerRate: userFees.stable_spot_maker_fee_rate * 100,
          takerRate: userFees.stable_spot_taker_fee_rate * 100,
        };
      } else {
        return {
          makerRate: userFees.spot_maker_fee_rate * 100,
          takerRate: userFees.spot_taker_fee_rate * 100,
        };
      }
    }
  },

  getFeeRates: (tradingType: TradingType, userFees: UserFees, isStableSpot: boolean) => {
    const fees = get().getFeeRatesRaw(tradingType, userFees, isStableSpot);
    if (Number(fees.makerRate) === 0 && Number(fees.takerRate) === 0) {
      return '-- / --';
    }
    return `${fees.takerRate.toFixed(4)}% / ${fees.makerRate.toFixed(4)}%`;
  },

  setUserFees: (userFees: UserFees) => {
    set({ userFees });
  },

  updateUserFees: (userFees: UserFees) => {
    set({ userFees: { ...get().userFees, ...userFees } });
  },

  clearUserFees: () => {
    set({
      userFees: {
        account: '',
        spot_volume_14d: '0',
        spot_volume_30d: '0',
        stable_spot_volume_14d: '0',
        stable_spot_volume_30d: '0',
        perp_volume_14d: '0',
        perp_volume_30d: '0',
        option_volume_14d: '0',
        option_volume_30d: '0',
        total_volume_threshold: 0,
        perp_maker_fee_rate: 0,
        perp_taker_fee_rate: 0,
        spot_maker_fee_rate: 0,
        spot_taker_fee_rate: 0,
        stable_spot_maker_fee_rate: 0,
        stable_spot_taker_fee_rate: 0,
        option_maker_fee_rate: 0,
        option_taker_fee_rate: 0,
      },
    });
  },

  setPositions: (positions: Position[]) => {
    const positionsRecord = positions.reduce(
      (acc, position) => {
        const key = `${position.instrument_id}:${position.position_side}`;
        acc[key] = position;
        return acc;
      },
      {} as Record<string, Position>,
    );
    set({ positions: positionsRecord });
    set({ successTable: { ...get().successTable, positions: true } });
    set({ success: true });
  },

  updatePositions: (positions: Position[]) => {
    const currentPositions = { ...get().positions };
    positions.forEach((position) => {
      const key = `${position.instrument_id}:${position.position_side}`;
      currentPositions[key] = position;
    });
    set({ positions: currentPositions });
    set({ successTable: { ...get().successTable, positions: true } });
    set({ success: true });
  },

  updatePosition: (key: string, position: Position) => {
    const currentPositions = { ...get().positions };
    currentPositions[key] = position;
    set({ positions: currentPositions });
  },

  clearPositions: () => {
    set({ positions: {} });
  },

  setOpenOrders: (openOrders: Order[]) => {
    const newOpenOrders = openOrders.reduce(
      (acc, order) => {
        acc[order.order_id] = order;
        return acc;
      },
      {} as Record<string, Order>,
    );
    set({ openOrders: newOpenOrders });
    set({ successTable: { ...get().successTable, openOrders: true } });
    set({ success: true });
  },

  updateOpenOrders: (order: Order) => {
    const currentOpenOrders = { ...get().openOrders };
    if (order.state === 'cancelled' || order.state === 'filled' || order.state === 'triggered') {
      delete currentOpenOrders[order.order_id];
      if (order.state !== 'triggered') {
        set({
          orderHistory: { ...get().orderHistory, [order.order_id]: order },
        });
      }
    } else {
      currentOpenOrders[order.order_id] = {
        ...order,
        trigger_px: order.trigger_px || order.trigger_price || '',
      };
    }
    set({ openOrders: currentOpenOrders });
    set({ successTable: { ...get().successTable, openOrders: true } });
    set({ success: true });
  },

  clearOpenOrders: () => {
    set({ openOrders: {} });
  },

  setOrderHistory: (orderHistory: OrderHistory[]) => {
    const newOrderHistory = orderHistory.reduce(
      (acc, order) => {
        acc[order.order_id] = order;
        return acc;
      },
      {} as Record<string, OrderHistory>,
    );
    set({ orderHistory: newOrderHistory });
    set({ successTable: { ...get().successTable, orderHistory: true } });
  },

  updateOrderHistory: (orderHistory: OrderHistory) => {
    const currentOrderHistory = { ...get().orderHistory };
    currentOrderHistory[orderHistory.order_id] = orderHistory;
    set({ orderHistory: currentOrderHistory });
    set({ successTable: { ...get().successTable, orderHistory: true } });
    set({ success: true });
  },

  clearOrderHistory: () => {
    set({ orderHistory: {} });
  },

  setTradeHistory: (tradeHistory: TradeHistory[]) => {
    const tradeHistoryRecord = tradeHistory.reverse().reduce(
      (acc, trade) => {
        acc[trade.trade_id] = trade;
        return acc;
      },
      {} as Record<string, TradeHistory>,
    );
    set({ tradeHistory: tradeHistoryRecord });
    set({ successTable: { ...get().successTable, tradeHistory: true } });
    set({ success: true });
  },

  updateTradeHistory: (tradeHistory: TradeHistory) => {
    const currentTradeHistory = { ...get().tradeHistory };
    const updatedTradeHistory = {
      [tradeHistory.trade_id]: tradeHistory,
      ...currentTradeHistory,
    };
    set({ tradeHistory: updatedTradeHistory });
    set({ successTable: { ...get().successTable, tradeHistory: true } });
    set({ success: true });
  },

  getOrderFromTradeHistory: (orderId: string) => {
    const { tradeHistory } = get();
    return Object.values(tradeHistory).find((trade) => trade.order_id.toString() === orderId);
  },

  clearTradeHistory: () => {
    set({ tradeHistory: {} });
  },

  setLeverage: (instrument: string, leverage: Leverage) => {
    const currentLeverage = { ...get().leverage };
    currentLeverage[instrument] = leverage;
    set({ leverage: currentLeverage });
  },

  updateLeverage: (instrument: string, leverage: Leverage) => {
    const currentLeverage = { ...get().leverage };
    currentLeverage[instrument] = leverage;
    set({ leverage: currentLeverage });
  },

  clearLeverage: () => {
    set({ leverage: {} });
  },

  setCollateralTransactions: (collateralTransactions: CollateralTransaction[]) => {
    set({ collateralTransactions });
  },

  updateCollateralTransactions: (collateralTransactions: CollateralTransaction[]) => {
    set({ collateralTransactions: [...get().collateralTransactions, ...collateralTransactions] });
  },

  clearCollateralTransactions: () => {
    set({ collateralTransactions: [] });
  },

  setFundingPayments: (fundingPayments: FundingPayment[]) => {
    set({ fundingPayments });
  },

  updateFundingPayments: (fundingPayments: FundingPayment[]) => {
    set({ fundingPayments: [...get().fundingPayments, ...fundingPayments] });
  },

  clearFundingPayments: () => {
    set({ fundingPayments: [] });
  },

  setVaults: (vaults: Vault[]) => {
    const vaultsRecord = vaults.reduce(
      (acc, vault) => {
        acc[vault.vault_address] = vault;
        return acc;
      },
      {} as Record<string, Vault>,
    );
    set({ vaults: vaultsRecord });
  },

  getVault: (vaultAddress: string) => {
    const { vaults } = get();
    return vaults[vaultAddress];
  },

  clearVaults: () => {
    set({ vaults: {} });
  },

  setSubVaults: (subVaults: SubVault[]) => {
    const subVaultsRecord = subVaults.reduce(
      (acc, subVault) => {
        acc[subVault.sub_vault_address] = subVault;
        return acc;
      },
      {} as Record<string, SubVault>,
    );
    set({ subVaults: subVaultsRecord });
  },

  clearSubVaults: () => {
    set({ subVaults: {} });
  },

  setReferralSummary: (referralSummary: IReferralSummary) => {
    set({
      referralSummary: { ...get().referralSummary, [referralSummary.address]: referralSummary },
    });
  },

  clearReferralSummary: () => {
    set({ referralSummary: {} });
  },

  setAccountInfo: (address: Address, accountInfo: IAccountInfo | null) => {
    set({ accountInfo: { ...get().accountInfo, [address]: accountInfo } });
  },

  clearAccountInfo: () => {
    set({ accountInfo: {} });
  },

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

  updatePendingStatusOrders: (cloid: string | Array<string>) => {
    if (Array.isArray(cloid)) {
      const currentPendingStatusOrders = [...get().pendingStatusOrders, ...cloid];
      set({ pendingStatusOrders: currentPendingStatusOrders });
    } else {
      const currentPendingStatusOrders = [...get().pendingStatusOrders, cloid];
      set({ pendingStatusOrders: currentPendingStatusOrders });
    }
  },

  deletePendingStatusOrder: (orderId: string) => {
    const currentPendingStatusOrders = get().pendingStatusOrders.filter((id) => id !== orderId);
    set({ pendingStatusOrders: currentPendingStatusOrders });
  },

  clearPendingStatusOrders: () => {
    set({ pendingStatusOrders: [] });
  },
});
