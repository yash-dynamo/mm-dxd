import { StateCreator } from 'zustand';
import { CollateralTransaction, FundingPayment } from '@/types/trading';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CollateralState {
  collateralTransactions: CollateralTransaction[];
  fundingPayments: FundingPayment[];
}

export interface CollateralActions {
  // Collateral Transactions
  setCollateralTransactions: (collateralTransactions: CollateralTransaction[]) => void;
  clearCollateralTransactions: () => void;

  // Funding Payments
  setFundingPayments: (fundingPayments: FundingPayment[]) => void;
  updateFundingPayments: (fundingPayments: FundingPayment[]) => void;
  clearFundingPayments: () => void;
}

export type CollateralSlice = CollateralState & CollateralActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: CollateralState = {
  collateralTransactions: [],
  fundingPayments: [],
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createCollateralSlice: StateCreator<CollateralSlice> = (set, get) => ({
  ...initialState,

  // Collateral Transactions
  setCollateralTransactions: (collateralTransactions) => set({ collateralTransactions }),

  clearCollateralTransactions: () => set({ collateralTransactions: [] }),

  // Funding Payments
  setFundingPayments: (fundingPayments) => set({ fundingPayments }),

  updateFundingPayments: (fundingPayments) =>
    set({ fundingPayments: [...get().fundingPayments, ...fundingPayments] }),

  clearFundingPayments: () => set({ fundingPayments: [] }),
});
