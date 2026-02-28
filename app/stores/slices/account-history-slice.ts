import { StateCreator } from 'zustand';
import { useAuthStore } from '@/stores';
import { AccountHistory } from '@/types/trading';

export type AddressToHistoryMap = Record<string, AccountHistory[]>;

export type AccountHistoryStoreState = {
  accountHistoryByAddress: AddressToHistoryMap;
  setAccountHistory: (address: string, points: AccountHistory[]) => void;
  getAccountHistory: (address: string) => AccountHistory[] | undefined;
  getUserAccountHistory: () => AccountHistory[] | undefined;
  getAccountHistoryByAddress: (address: string) => AccountHistory[] | undefined;
  clearAccountHistory: (address?: string) => void;
};

export const createAccountHistorySlice: StateCreator<AccountHistoryStoreState> = (set, get) => ({
  accountHistoryByAddress: {},
  setAccountHistory: (address, points) => {
    const current = { ...get().accountHistoryByAddress };
    current[address] = points;
    set({ accountHistoryByAddress: current });
  },
  getAccountHistory: (address: string) => get().accountHistoryByAddress[address],
  getUserAccountHistory: () => {
    const addr = useAuthStore.getState().address;
    return addr ? get().accountHistoryByAddress[addr] : undefined;
  },
  getAccountHistoryByAddress: (address: string) => get().accountHistoryByAddress[address],
  clearAccountHistory: (address) => {
    if (!address) {
      set({ accountHistoryByAddress: {} });
      return;
    }
    const current = { ...get().accountHistoryByAddress };
    delete current[address];
    set({ accountHistoryByAddress: current });
  },
});
