import { StateCreator } from 'zustand';
import type { Session, SymbolConfig, ConfigDefaultsResponse, TakerConfig } from '@/lib/dxd-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DxdSessionsState {
  sessions: Session[];
  /** Session currently being viewed in detail */
  activeSessionId: string | null;
  /** Loaded from GET /v1/config/defaults */
  configDefaults: ConfigDefaultsResponse | null;
  /** Effective merged config per symbol for active session */
  activeSessionConfig: Record<string, SymbolConfig> | null;
  /** Taker session effective config (GET/PATCH /config for strategy=taker) */
  activeTakerConfig: TakerConfig | null;
  isLoadingSessions: boolean;
  isLoadingDefaults: boolean;
  sessionsError: string | null;
}

export interface DxdSessionsActions {
  setSessions: (sessions: Session[]) => void;
  upsertSession: (session: Session) => void;
  /** Merge fields (e.g. strategy) when API list omits them but GET /config implies mode */
  patchSessionRow: (id: string, partial: Partial<Session>) => void;
  updateSessionStatus: (id: string, status: Session['status']) => void;
  setActiveSessionId: (id: string | null) => void;
  setConfigDefaults: (defaults: ConfigDefaultsResponse) => void;
  setActiveSessionConfig: (config: Record<string, SymbolConfig> | null) => void;
  setActiveTakerConfig: (config: TakerConfig | null) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingDefaults: (loading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  clearSessions: () => void;
}

export type DxdSessionsSlice = DxdSessionsState & DxdSessionsActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: DxdSessionsState = {
  sessions: [],
  activeSessionId: null,
  configDefaults: null,
  activeSessionConfig: null,
  activeTakerConfig: null,
  isLoadingSessions: false,
  isLoadingDefaults: false,
  sessionsError: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createDxdSessionsSlice: StateCreator<DxdSessionsSlice> = (set, get) => ({
  ...initialState,

  setSessions: (sessions) => set({ sessions }),

  upsertSession: (session) => {
    const existing = get().sessions;
    const idx = existing.findIndex((s) => s.session_id === session.session_id);
    if (idx >= 0) {
      const updated = [...existing];
      updated[idx] = session;
      set({ sessions: updated });
    } else {
      set({ sessions: [session, ...existing] });
    }
  },

  patchSessionRow: (id, partial) => {
    set({
      sessions: get().sessions.map((s) => (s.session_id === id ? { ...s, ...partial } : s)),
    });
  },

  updateSessionStatus: (id, status) => {
    set({
      sessions: get().sessions.map((s) =>
        s.session_id === id ? { ...s, status } : s,
      ),
    });
  },

  setActiveSessionId: (id) => set({ activeSessionId: id }),

  setConfigDefaults: (defaults) => set({ configDefaults: defaults }),

  setActiveSessionConfig: (config) => set({ activeSessionConfig: config }),

  setActiveTakerConfig: (config) => set({ activeTakerConfig: config }),

  setLoadingSessions: (loading) => set({ isLoadingSessions: loading }),

  setLoadingDefaults: (loading) => set({ isLoadingDefaults: loading }),

  setSessionsError: (error) => set({ sessionsError: error }),

  clearSessions: () =>
    set({
      ...initialState,
    }),
});
