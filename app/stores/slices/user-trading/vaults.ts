import { StateCreator } from 'zustand';
import { IReferralSummary } from '@/types/trading';
import { SubVault, Vault } from '@/types/vault';
import { Address } from 'viem';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserVaultsState {
  vaults: Record<string, Vault>;
  subVaults: Record<string, SubVault>;
  referralSummary: Record<Address, IReferralSummary>;
}

export interface UserVaultsActions {
  // Vaults
  setVaults: (vaults: Vault[]) => void;
  getVault: (vaultAddress: string) => Vault;
  clearVaults: () => void;

  // Sub-Vaults
  setSubVaults: (subVaults: SubVault[]) => void;
  clearSubVaults: () => void;

  // Referral Summary (keyed by wallet address)
  setReferralSummary: (referralSummary: IReferralSummary) => void;
  clearReferralSummary: () => void;
}

type UserVaultsSlice = UserVaultsState & UserVaultsActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: UserVaultsState = {
  vaults: {},
  subVaults: {},
  referralSummary: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createUserVaultsSlice: StateCreator<UserVaultsSlice> = (set, get) => ({
  ...initialState,

  // Vaults
  setVaults: (vaults) => {
    const record = vaults.reduce(
      (acc, vault) => {
        acc[vault.vault_address] = vault;
        return acc;
      },
      {} as Record<string, Vault>,
    );
    set({ vaults: record });
  },

  getVault: (vaultAddress) => get().vaults[vaultAddress],

  clearVaults: () => set({ vaults: {} }),

  // Sub-Vaults
  setSubVaults: (subVaults) => {
    const record = subVaults.reduce(
      (acc, subVault) => {
        acc[subVault.sub_vault_address] = subVault;
        return acc;
      },
      {} as Record<string, SubVault>,
    );
    set({ subVaults: record });
  },

  clearSubVaults: () => set({ subVaults: {} }),

  // Referral Summary
  setReferralSummary: (referralSummary) =>
    set({
      referralSummary: { ...get().referralSummary, [referralSummary.address]: referralSummary },
    }),

  clearReferralSummary: () => set({ referralSummary: {} }),
});
