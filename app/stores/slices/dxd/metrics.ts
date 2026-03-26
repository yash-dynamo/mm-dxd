import { StateCreator } from 'zustand';
import type { SymbolMetrics } from '@/lib/dxd-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HistoryRow = { symbol: string } & SymbolMetrics;

export interface DxdMetricsState {
  /** Live snapshot: sessionId → symbol → latest metrics */
  liveMetrics: Record<string, Record<string, SymbolMetrics>>;
  /** Historical rows: sessionId → rows ordered ts DESC */
  history: Record<string, HistoryRow[]>;
  /** True while waiting for first metrics after session start (404 warmup) */
  isWarmingUp: Record<string, boolean>;
  /** Indicates a PATCH /config restart gap (~2-3s) */
  isRestarting: Record<string, boolean>;
}

export interface DxdMetricsActions {
  setLiveMetrics: (sessionId: string, metrics: Record<string, SymbolMetrics>) => void;
  setHistory: (sessionId: string, rows: HistoryRow[]) => void;
  upsertHistoryRows: (sessionId: string, rows: HistoryRow[]) => void;
  setWarmingUp: (sessionId: string, warming: boolean) => void;
  setRestarting: (sessionId: string, restarting: boolean) => void;
  clearMetrics: (sessionId: string) => void;
}

export type DxdMetricsSlice = DxdMetricsState & DxdMetricsActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: DxdMetricsState = {
  liveMetrics: {},
  history: {},
  isWarmingUp: {},
  isRestarting: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createDxdMetricsSlice: StateCreator<DxdMetricsSlice> = (set, get) => ({
  ...initialState,

  setLiveMetrics: (sessionId, metrics) =>
    set({ liveMetrics: { ...get().liveMetrics, [sessionId]: metrics } }),

  setHistory: (sessionId, rows) =>
    set({ history: { ...get().history, [sessionId]: rows } }),

  upsertHistoryRows: (sessionId, rows) => {
    if (rows.length === 0) return;

    const existing = get().history[sessionId] ?? [];
    const byKey = new Map<string, HistoryRow>();

    for (const row of existing) {
      byKey.set(`${row.symbol}|${row.ts}`, row);
    }
    for (const row of rows) {
      byKey.set(`${row.symbol}|${row.ts}`, row);
    }

    const merged = Array.from(byKey.values())
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 2000);

    set({ history: { ...get().history, [sessionId]: merged } });
  },

  setWarmingUp: (sessionId, warming) =>
    set({ isWarmingUp: { ...get().isWarmingUp, [sessionId]: warming } }),

  setRestarting: (sessionId, restarting) =>
    set({ isRestarting: { ...get().isRestarting, [sessionId]: restarting } }),

  clearMetrics: (sessionId) => {
    const { liveMetrics, history, isWarmingUp, isRestarting } = get();
    const lm = { ...liveMetrics };
    const h = { ...history };
    const wu = { ...isWarmingUp };
    const re = { ...isRestarting };
    delete lm[sessionId];
    delete h[sessionId];
    delete wu[sessionId];
    delete re[sessionId];
    set({ liveMetrics: lm, history: h, isWarmingUp: wu, isRestarting: re });
  },
});
