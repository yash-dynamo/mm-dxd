import { StateCreator } from 'zustand';
import { Address } from 'viem';
import { IUserMetadata, IAgent, IPendingAgentPayload } from '@/types';
import { normalizeAddress } from '@/utils/formatting';
export interface AuthState {
  address: Address;
  master: Address;
  activeVault: Address;
  userMetadata: Record<Address, IUserMetadata>;
  status: 'connected' | 'trading-enabled' | 'disconnected' | 'user-not-found';
  agents: Record<Address, IAgent>;
  pendingAgents: Record<Address, IPendingAgentPayload>;
  clearPendingAgent: (ownerAddress: Address) => void;
  isLoading: boolean;
  legalTermsSigned: Record<Address, boolean>;
  /** True if user has metadata on testnet (mainnet) or always true when on testnet */
  isTestnetOg: boolean;
}

export interface AuthActions {
  setAddress: (address: Address) => void;
  setMaster: (masterAddress: Address) => void;
  setActiveVault: (vaultAddress: Address) => void;
  setUserMetadata: (userAddress: Address, userMetadata: IUserMetadata) => void;
  clearUserMetadata: () => void;
  setStatus: (status: 'connected' | 'trading-enabled' | 'disconnected' | 'user-not-found') => void;
  setAgent: (ownerAddress: Address, agent: IAgent) => void;
  setAgents: (agents: Record<Address, IAgent>) => void;
  setPendingAgent: (ownerAddress: Address, agent: IPendingAgentPayload) => void;
  setPendingAgents: (agents: Record<Address, IPendingAgentPayload>) => void;
  clearAgent: (ownerAddress: Address) => void;
  setLoading: (loading: boolean) => void;
  getAgents: () => Record<Address, IAgent>;
  getLoading: () => boolean;
  clearAuth: () => void;
  clearPersistedAuth: () => void;
  updateStatusFromAccountSummary: (hasCollateral: boolean) => void;
  updateStatusOnConnect: (address: Address, vaultAddress?: Address) => void;
  isUserMetadataLoading: boolean;
  setIsUserMetadataLoading: (loading: boolean) => void;
  setLegalTermsSigned: (userAddress: Address, signed: boolean) => void;
  hasSignedLegalTerms: (userAddress: Address) => boolean;
  setTestnetOg: (value: boolean) => void;
}

export type AuthStoreState = AuthState & AuthActions;

export const createAuthSlice: StateCreator<AuthStoreState> = (set, get) => ({
  address: '0x0000000000000000000000000000000000000000',
  master: '0x0000000000000000000000000000000000000000',
  activeVault: '0x0000000000000000000000000000000000000000',
  status: 'disconnected',
  agents: {},
  pendingAgents: {},
  isLoading: false,
  userMetadata: {},
  isUserMetadataLoading: true,
  legalTermsSigned: {},
  isTestnetOg: false,

  setTestnetOg: (value: boolean) => set({ isTestnetOg: value }),

  setAddress: (address: Address) => {
    set({ address: normalizeAddress(address) });
  },

  setMaster: (masterAddress: Address) => {
    set({ master: normalizeAddress(masterAddress) });
  },

  setActiveVault: (vaultAddress: Address) => {
    set({ activeVault: normalizeAddress(vaultAddress) });
  },

  setUserMetadata: (userAddress: Address, userMetadata: IUserMetadata) => {
    const normalized = normalizeAddress(userAddress);
    set({ userMetadata: { ...get().userMetadata, [normalized]: userMetadata } });
  },

  clearUserMetadata: () => {
    set({ userMetadata: {} });
  },

  setStatus: (status: 'connected' | 'trading-enabled' | 'disconnected' | 'user-not-found') => {
    set({ status });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setIsUserMetadataLoading: (loading: boolean) => {
    set({ isUserMetadataLoading: loading });
  },

  setLegalTermsSigned: (userAddress: Address, signed: boolean) => {
    const normalized = normalizeAddress(userAddress);
    set({ legalTermsSigned: { ...get().legalTermsSigned, [normalized]: signed } });
  },

  hasSignedLegalTerms: (userAddress: Address) => {
    const normalized = normalizeAddress(userAddress);
    return get().legalTermsSigned[normalized] === true;
  },

  setAgent: (ownerAddress: Address, agent: IAgent) => {
    const normalized = normalizeAddress(ownerAddress);
    // Also normalize the agent's address field if present
    const normalizedAgent = agent
      ? { ...agent, address: normalizeAddress(agent.address) }
      : agent;
    set({ ...get(), agents: { ...get().agents, [normalized]: normalizedAgent } });
  },

  setAgents: (agents: Record<Address, IAgent>) => {
    // Normalize all keys and agent addresses in the agents record
    const normalizedAgents = Object.entries(agents).reduce(
      (acc, [key, value]) => {
        acc[normalizeAddress(key as Address)] = value
          ? { ...value, address: normalizeAddress(value.address) }
          : value;
        return acc;
      },
      {} as Record<Address, IAgent>,
    );
    set({ ...get(), agents: { ...get().agents, ...normalizedAgents } });
  },

  setPendingAgent: (ownerAddress: Address, pendingAgent: IPendingAgentPayload) => {
    const normalized = normalizeAddress(ownerAddress);
    // Also normalize nested addresses in pendingAgent params
    const normalizedPendingAgent = pendingAgent
      ? {
        ...pendingAgent,
        params: {
          ...pendingAgent.params,
          agent: normalizeAddress(pendingAgent.params.agent),
          forAccount: normalizeAddress(pendingAgent.params.forAccount),
        },
      }
      : pendingAgent;
    set({ ...get(), pendingAgents: { ...get().pendingAgents, [normalized]: normalizedPendingAgent } });
  },

  setPendingAgents: (pendingAgents: Record<Address, IPendingAgentPayload>) => {
    // Normalize all keys and nested addresses in the pendingAgents record
    const normalizedPendingAgents = Object.entries(pendingAgents).reduce(
      (acc, [key, value]) => {
        acc[normalizeAddress(key as Address)] = value
          ? {
            ...value,
            params: {
              ...value.params,
              agent: normalizeAddress(value.params.agent),
              forAccount: normalizeAddress(value.params.forAccount),
            },
          }
          : value;
        return acc;
      },
      {} as Record<Address, IPendingAgentPayload>,
    );
    set({ ...get(), pendingAgents: { ...get().pendingAgents, ...normalizedPendingAgents } });
  },

  clearPendingAgent: (ownerAddress: Address) => {
    const normalized = normalizeAddress(ownerAddress);
    const updatedPendingAgents = { ...get().pendingAgents };
    delete updatedPendingAgents[normalized];
    set({ ...get(), pendingAgents: updatedPendingAgents });
  },

  clearAgent: (ownerAddress: Address) => {
    const normalized = normalizeAddress(ownerAddress);
    const updatedAgents = { ...get().agents };
    delete updatedAgents[normalized];
    set({ ...get(), agents: updatedAgents });
  },

  getAgents: () => {
    const { agents } = get();
    return agents;
  },

  getLoading: () => {
    const { isLoading } = get();
    return isLoading;
  },

  clearPersistedAuth: () => {
    localStorage.removeItem('hotstuff-auth');
    sessionStorage.removeItem('hotstuff-auth');
    set({
      address: '0x0000000000000000000000000000000000000000',
      activeVault: '0x0000000000000000000000000000000000000000',
      master: '0x0000000000000000000000000000000000000000',
      status: 'disconnected',
      agents: {},
      pendingAgents: {},
      userMetadata: {},
      legalTermsSigned: {},
      isTestnetOg: false,
    });
  },

  clearAuth: () => {
    set({
      ...get(),
      address: '0x0000000000000000000000000000000000000000',
      activeVault: '0x0000000000000000000000000000000000000000',
      master: '0x0000000000000000000000000000000000000000',
      status: 'disconnected',
      userMetadata: {},
      legalTermsSigned: {},
      isTestnetOg: false,
    });
  },

  updateStatusFromAccountSummary: (hasCollateral: boolean) => {
    const currentStatus = get().status;

    if (currentStatus === 'disconnected') return;

    if (!hasCollateral && currentStatus !== 'user-not-found') {
      set({ status: 'user-not-found' });
    } else if (hasCollateral && currentStatus === 'user-not-found') {
      const address = get().address;
      const agents = get().agents;
      const hasAgent = agents[address] !== undefined;
      set({ status: hasAgent ? 'trading-enabled' : 'connected' });
    }
  },

  updateStatusOnConnect: (address: Address, vaultAddress?: Address) => {
    const normalizedAddress = normalizeAddress(address);
    const currentStatus = get().status;
    const currentAddress = get().address;

    // If the address is the same and we already have a refined status (user-not-found),
    // don't override it with a less accurate status (connected)
    // user-not-found is set by useAccountSummary after checking the API
    const isSameAddress = normalizedAddress === currentAddress ||
      (vaultAddress && normalizeAddress(vaultAddress) === currentAddress);

    if (isSameAddress && currentStatus === 'user-not-found') {
      // Still update address/master/vault fields, but preserve status
      if (vaultAddress) {
        const normalizedVault = normalizeAddress(vaultAddress);
        set({
          address: normalizedVault,
          master: normalizedAddress,
          activeVault: normalizedVault,
        });
      } else {
        set({
          address: normalizedAddress,
          master: normalizedAddress,
          activeVault: '0x0000000000000000000000000000000000000000',
        });
      }
      return;
    }

    if (vaultAddress) {
      const normalizedVault = normalizeAddress(vaultAddress);
      const agents = get().agents;
      const existingAgent = agents[normalizedVault];
      const newStatus = existingAgent !== undefined ? 'trading-enabled' : 'connected';
      set({
        address: normalizedVault,
        master: normalizedAddress,
        activeVault: normalizedVault,
        status: newStatus,
      });
    } else {
      const agents = get().agents;
      const existingAgent = agents[normalizedAddress];
      const newStatus = existingAgent !== undefined ? 'trading-enabled' : 'connected';
      set({
        address: normalizedAddress,
        master: normalizedAddress,
        activeVault: '0x0000000000000000000000000000000000000000',
        status: newStatus,
      });
    }
  },
});
