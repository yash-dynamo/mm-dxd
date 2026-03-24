import { StateCreator } from 'zustand';
import { AccountSummary, AgentWallet, IAccountInfo } from '@/types/trading';
import { Address } from 'viem';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccountState {
  accountSummary: AccountSummary;
  agentWallets: AgentWallet[];
  accountInfo: Record<Address, IAccountInfo | null>;
}

export interface AccountActions {
  // Account Summary
  setAccountSummary: (accountSummary: AccountSummary) => void;
  updateAccountSummary: (accountSummary: AccountSummary) => void;
  clearAccountSummary: () => void;
  getUserVaultShares: (
    vaultAddress: string,
    accountSummary: AccountSummary,
  ) => { withdrawable_shares: string; total_shares: string; amount: string };

  // Agent Wallets
  setAgentWallets: (agentWallets: AgentWallet[]) => void;
  clearAgentWallets: () => void;

  // Account Info (per-address cache)
  setAccountInfo: (address: Address, accountInfo: IAccountInfo | null) => void;
  clearAccountInfo: () => void;
}

type AccountSlice = AccountState & AccountActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const emptyAccountSummary: AccountSummary = {
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
};

const initialState: AccountState = {
  accountSummary: emptyAccountSummary,
  agentWallets: [],
  accountInfo: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createAccountSlice: StateCreator<AccountSlice> = (set, get) => ({
  ...initialState,

  // Account Summary
  setAccountSummary: (accountSummary) => set({ accountSummary }),

  updateAccountSummary: (accountSummary) =>
    set({ accountSummary: { ...get().accountSummary, ...accountSummary } }),

  clearAccountSummary: () => set({ accountSummary: emptyAccountSummary }),

  getUserVaultShares: (vaultAddress, accountSummary) => ({
    withdrawable_shares:
      accountSummary?.vault_balances?.[vaultAddress]?.withdrawable_shares?.toString() || '0',
    total_shares:
      accountSummary?.vault_balances?.[vaultAddress]?.total_shares?.toString() || '0',
    amount: accountSummary?.vault_balances?.[vaultAddress]?.amount?.toString() || '0',
  }),

  // Agent Wallets
  setAgentWallets: (agentWallets) => set({ agentWallets }),

  clearAgentWallets: () => set({ agentWallets: [] }),

  // Account Info
  setAccountInfo: (address, accountInfo) =>
    set({ accountInfo: { ...get().accountInfo, [address]: accountInfo } }),

  clearAccountInfo: () => set({ accountInfo: {} }),
});
