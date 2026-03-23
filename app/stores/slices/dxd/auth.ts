import { StateCreator } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DxdAuthState {
  /** JWT from POST /v1/auth/login */
  token: string | null;
  userId: string | null;
  /** The main HotStuff wallet address that was used to sign in */
  dxdWalletAddress: string | null;
  /** Agent address registered via exchange.addAgent() */
  agentAddress: string | null;
  /** Agent name chosen by the user */
  agentName: string | null;
  isAuthenticated: boolean;
}

export interface DxdAuthActions {
  setDxdAuth: (token: string, userId: string, walletAddress: string) => void;
  setAgentInfo: (agentAddress: string, agentName: string) => void;
  clearDxdAuth: () => void;
}

export type DxdAuthSlice = DxdAuthState & DxdAuthActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: DxdAuthState = {
  token: null,
  userId: null,
  dxdWalletAddress: null,
  agentAddress: null,
  agentName: null,
  isAuthenticated: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createDxdAuthSlice: StateCreator<DxdAuthSlice> = (set) => ({
  ...initialState,

  setDxdAuth: (token, userId, walletAddress) =>
    set({ token, userId, dxdWalletAddress: walletAddress, isAuthenticated: true }),

  setAgentInfo: (agentAddress, agentName) =>
    set({ agentAddress, agentName }),

  clearDxdAuth: () => set(initialState),
});
