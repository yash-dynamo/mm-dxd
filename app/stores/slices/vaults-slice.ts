import { StateCreator } from 'zustand';
import { SubVault, Vault } from '@/types/vault';
import { AccountSummary, Position, Order, OrderHistory, TradeHistory } from '@/types/trading';
import { Address } from 'viem';

const vautTableStates = {
  tradeHistory: false,
  orderHistory: false,
  fundingPayments: false,
  positions: false,
  openOrders: false,
} as const;

export interface VaultsState {
  vaults: Record<string, Vault>;
  feeReceiver: Record<Address, AccountSummary>;
  subVaults: Record<string, SubVault[]>; // Keyed by vault address - decoupled from vaults
  subVaultsSuccess: Record<string, boolean>; // Keyed by vault address - decoupled from vaults
  subVaultAccountSummaries: Record<string, AccountSummary>; // Keyed by sub-vault address
  isLoading: boolean;
  loadingTable: Record<string, Record<keyof typeof vautTableStates, boolean>>;
  successTable: Record<string, Record<keyof typeof vautTableStates, boolean>>;
  success: boolean;
}

export interface VaultsActions {
  // Vaults management
  setVaults: (vaults: Vault[]) => void;
  getVaults: () => Record<string, Vault>;
  updateVault: (vault: Vault) => void;
  removeVault: (vaultAddress: string) => void;
  clearVaults: () => void;

  setFeeReceiver: (address: Address, accountSummary: AccountSummary) => void;
  clearFeeReceiver: () => void;

  setSubVaults: (vaultAddress: string, subVaults: SubVault[]) => void;
  setVaultAccountSummary: (vaultAddress: string, accountSummary: AccountSummary) => void;
  updateVaultAccountSummary: (vaultAddress: string, updatedAccountSummary: AccountSummary) => void;
  setSubVaultAccountSummary: (subVaultAddress: string, accountSummary: AccountSummary) => void;
  updateSubVaultAccountSummary: (
    subVaultAddress: string,
    updatedAccountSummary: AccountSummary,
  ) => void;
  getSubVaultAccountSummary: (subVaultAddress: string) => AccountSummary | undefined;

  setVaultPositions: (vaultAddress: string, positions: Position[]) => void;
  updateVaultPositions: (vaultAddress: string, positions: Position[]) => void;
  updateVaultPosition: (vaultAddress: string, key: string, position: Position) => void;
  deleteVaultPosition: (vaultAddress: string, instrument_id: string, position_side: string) => void;
  setVaultOpenOrders: (vaultAddress: string, openOrders: Order[]) => void;
  updateVaultOpenOrders: (vaultAddress: string, updatedOrder: Order) => void;
  setVaultOrderHistory: (vaultAddress: string, orderHistory: OrderHistory[]) => void;
  setVaultTradeHistory: (vaultAddress: string, tradeHistory: TradeHistory[]) => void;
  updateVaultTradeHistory: (vaultAddress: string, tradeHistory: TradeHistory) => void;
  getVault: (vaultAddress: string) => Vault; // Loading state
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  setLoadingTable: (
    vaultAddress: string,
    loading: boolean,
    subItems: keyof typeof vautTableStates,
  ) => void;
  setSuccessTable: (
    vaultAddress: string,
    success: boolean,
    subItems: keyof typeof vautTableStates,
  ) => void;
  getTableLoading: (vaultAddress: string) => Record<keyof typeof vautTableStates, boolean>;
  getTableSuccess: (vaultAddress: string) => Record<keyof typeof vautTableStates, boolean>;

  getSubVaultAddresses: (vaultAddress: string) => string[];
  getVaultOpenOrders: (vaultAddress: string) => Order[];
  getSubVaults: (vaultAddress: string) => SubVault[];
}

export type VaultsStoreState = VaultsState & VaultsActions;

export const createVaultsSlice: StateCreator<VaultsStoreState> = (set, get) => ({
  vaults: {},
  subVaults: {},
  subVaultsSuccess: {},
  subVaultAccountSummaries: {},
  isLoading: false,
  success: false,
  loadingTable: {},
  successTable: {},
  feeReceiver: {},

  setFeeReceiver: (address: Address, accountSummary: AccountSummary) => {
    const currentFeeReceiver = { ...get().feeReceiver };
    currentFeeReceiver[address] = accountSummary;
    set({ feeReceiver: currentFeeReceiver });
  },

  clearFeeReceiver: () => {
    set({ feeReceiver: {} });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setSuccess: (success: boolean) => {
    set({ success: success });
  },

  setLoadingTable: (
    vaultAddress: string,
    loading: boolean,
    subItems: keyof typeof vautTableStates,
  ) => {
    const currentLoadingTable = { ...get().loadingTable };
    if (!currentLoadingTable[vaultAddress]) {
      currentLoadingTable[vaultAddress] = { ...vautTableStates };
    }
    currentLoadingTable[vaultAddress] = {
      ...currentLoadingTable[vaultAddress],
      [subItems]: loading,
    };
    set({ loadingTable: currentLoadingTable });
  },

  setSuccessTable: (
    vaultAddress: string,
    success: boolean,
    subItems: keyof typeof vautTableStates,
  ) => {
    const currentSuccessTable = { ...get().successTable };
    if (!currentSuccessTable[vaultAddress]) {
      currentSuccessTable[vaultAddress] = { ...vautTableStates };
    }
    currentSuccessTable[vaultAddress] = {
      ...currentSuccessTable[vaultAddress],
      [subItems]: success,
    };
    set({ successTable: currentSuccessTable });
  },

  getTableLoading: (vaultAddress: string) => {
    const { loadingTable } = get();
    return loadingTable[vaultAddress] || vautTableStates;
  },

  getTableSuccess: (vaultAddress: string) => {
    const { successTable } = get();
    return successTable[vaultAddress] || vautTableStates;
  },

  getVault: (vaultAddress: string) => {
    const { vaults, subVaults, subVaultsSuccess } = get();
    const vault = vaults[vaultAddress];
    if (!vault) return vault;
    // Merge sub_vaults from separate storage to prevent race conditions
    return {
      ...vault,
      sub_vaults: subVaults[vaultAddress],
      sub_vaults_success: subVaultsSuccess[vaultAddress],
    };
  },

  getVaults: () => {
    const { vaults } = get();
    return vaults;
  },

  getVaultOpenOrders: (vaultAddress: string): Order[] => {
    const vault = get().getVault(vaultAddress);
    return vault.open_orders?.filter((order) => order.tpsl === '') || [];
  },

  getSubVaultAddresses: (vaultAddress: string) => {
    const { subVaults } = get();
    return subVaults[vaultAddress]?.map((subVault) => subVault.sub_vault_address) || [];
  },

  getSubVaults: (vaultAddress: string) => {
    const { subVaults } = get();
    return subVaults[vaultAddress] || [];
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
    set({ success: true });
  },

  updateVault: (vault: Vault) => {
    const currentVaults = { ...get().vaults };
    currentVaults[vault.vault_address] = vault;
    set({ vaults: currentVaults });
  },

  setVaultAccountSummary: (vaultAddress: string, accountSummary: AccountSummary) => {
    const currentVaults = { ...get().vaults };
    currentVaults[vaultAddress].account_summary = accountSummary;
    set({ vaults: currentVaults });
  },

  updateVaultAccountSummary: (vaultAddress: string, updatedAccountSummary: AccountSummary) => {
    const currentVaults = { ...get().vaults };
    // Create a new vault object reference to ensure Zustand detects the change
    currentVaults[vaultAddress] = {
      ...currentVaults[vaultAddress],
      account_summary: updatedAccountSummary,
    };
    set({ vaults: currentVaults });
  },

  setSubVaultAccountSummary: (subVaultAddress: string, accountSummary: AccountSummary) => {
    const currentSummaries = { ...get().subVaultAccountSummaries };
    currentSummaries[subVaultAddress] = accountSummary;
    set({ subVaultAccountSummaries: currentSummaries });
  },

  updateSubVaultAccountSummary: (
    subVaultAddress: string,
    updatedAccountSummary: AccountSummary,
  ) => {
    const currentSummaries = { ...get().subVaultAccountSummaries };
    currentSummaries[subVaultAddress] = updatedAccountSummary;
    set({ subVaultAccountSummaries: currentSummaries });
  },

  getSubVaultAccountSummary: (subVaultAddress: string) => {
    const { subVaultAccountSummaries } = get();
    return subVaultAccountSummaries[subVaultAddress];
  },

  setVaultPositions: (vaultAddress: string, positions: Position[]) => {
    const currentVaults = { ...get().vaults };
    const positionsRecord = positions.reduce(
      (acc, position) => {
        const key = `${position.instrument_id}:${position.position_side}`;
        acc[key] = position;
        return acc;
      },
      {} as Record<string, Position>,
    );
    currentVaults[vaultAddress].positions = positionsRecord;
    set({ vaults: currentVaults });
  },

  updateVaultPositions: (vaultAddress: string, positions: Position[]) => {
    const currentVaults = { ...get().vaults };
    if (currentVaults[vaultAddress]) {
      const currentPositions = { ...currentVaults[vaultAddress].positions };
      positions.forEach((position) => {
        const key = `${position.instrument_id}:${position.position_side}`;
        currentPositions[key] = position;
      });
      currentVaults[vaultAddress].positions = currentPositions;
      set({ vaults: currentVaults });
    }
  },

  updateVaultPosition: (vaultAddress: string, key: string, position: Position) => {
    const currentVaults = { ...get().vaults };
    if (currentVaults[vaultAddress]) {
      currentVaults[vaultAddress].positions = {
        ...currentVaults[vaultAddress].positions,
        [key]: position,
      };
      set({ vaults: currentVaults });
    }
  },

  deleteVaultPosition: (vaultAddress: string, instrument_id: string, position_side: string) => {
    const currentVaults = { ...get().vaults };
    if (currentVaults[vaultAddress]) {
      if (currentVaults[vaultAddress].positions) {
        delete currentVaults[vaultAddress].positions[`${instrument_id}:${position_side}`];
      }
      set({ vaults: currentVaults });
    }
  },

  setVaultOpenOrders: (vaultAddress: string, openOrders: Order[]) => {
    const currentVaults = { ...get().vaults };
    currentVaults[vaultAddress].open_orders = openOrders;
    set({ vaults: currentVaults });
  },

  updateVaultOpenOrders: (vaultAddress: string, updatedOrder: Order) => {
    const currentVaults = { ...get().vaults };
    const vault = currentVaults[vaultAddress];
    if (vault && vault.open_orders) {
      const existingIndex = vault.open_orders.findIndex(
        (order) => order.order_id === updatedOrder.order_id,
      );
      const shouldRemove =
        updatedOrder.state === 'cancelled' ||
        updatedOrder.state === 'filled' ||
        updatedOrder.state === 'triggered';
      const formattedOrder = {
        ...updatedOrder,
        trigger_px: updatedOrder.trigger_px || updatedOrder.trigger_price || '',
      };

      if (existingIndex !== -1) {
        if (shouldRemove) {
          vault.open_orders.splice(existingIndex, 1);
        } else {
          vault.open_orders[existingIndex] = formattedOrder;
        }
      } else if (!shouldRemove) {
        vault.open_orders.push(formattedOrder);
      }
      set({ vaults: currentVaults });
    }
  },

  setVaultOrderHistory: (vaultAddress: string, orderHistory: OrderHistory[]) => {
    const currentVaults = { ...get().vaults };
    currentVaults[vaultAddress].order_history = orderHistory;
    set({ vaults: currentVaults });
  },

  setVaultTradeHistory: (vaultAddress: string, tradeHistory: TradeHistory[]) => {
    const currentVaults = { ...get().vaults };
    currentVaults[vaultAddress].trade_history = tradeHistory;
    set({ vaults: currentVaults });
    get().setSuccessTable(vaultAddress, true, 'tradeHistory');
  },

  updateVaultTradeHistory: (vaultAddress: string, tradeHistory: TradeHistory) => {
    const currentTradeHistory = get().vaults[vaultAddress].trade_history;
    if (currentTradeHistory) {
      currentTradeHistory.push(tradeHistory);
      get().setVaultTradeHistory(vaultAddress, [...currentTradeHistory]);
    }
  },

  setSubVaults: (vaultAddress: string, subVaults: SubVault[]) => {
    // Store sub_vaults separately to prevent race conditions with setVaults
    const currentSubVaults = { ...get().subVaults };
    const currentSubVaultsSuccess = { ...get().subVaultsSuccess };
    currentSubVaults[vaultAddress] = subVaults;
    currentSubVaultsSuccess[vaultAddress] = true;
    set({
      subVaults: currentSubVaults,
      subVaultsSuccess: currentSubVaultsSuccess,
    });
  },

  removeVault: (vaultAddress: string) => {
    const currentVaults = { ...get().vaults };
    const currentSubVaults = { ...get().subVaults };
    const currentSubVaultsSuccess = { ...get().subVaultsSuccess };
    delete currentVaults[vaultAddress];
    delete currentSubVaults[vaultAddress];
    delete currentSubVaultsSuccess[vaultAddress];
    set({
      vaults: currentVaults,
      subVaults: currentSubVaults,
      subVaultsSuccess: currentSubVaultsSuccess,
    });
  },

  clearVaults: () => {
    set({
      vaults: {},
      subVaults: {},
      subVaultsSuccess: {},
    });
  },
});
