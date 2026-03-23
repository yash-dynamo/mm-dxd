import { StateCreator } from 'zustand';
import { Position } from '@/types/trading';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Leverage {
  leverage: number;
  margin_mode: string;
}

export interface PositionsState {
  positions: Record<string, Position>;
  leverage: Record<string, Leverage>;
}

export interface PositionsActions {
  setPositions: (positions: Position[]) => void;
  updatePositions: (positions: Position[]) => void;
  updatePosition: (key: string, position: Position) => void;
  clearPositions: () => void;
  deletePosition: (instrument_id: string, position_side: string) => void;

  setLeverage: (instrument: string, leverage: Leverage) => void;
  clearLeverage: () => void;
}

export type PositionsSlice = PositionsState & PositionsActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: PositionsState = {
  positions: {},
  leverage: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createPositionsSlice: StateCreator<PositionsSlice> = (set, get) => ({
  ...initialState,

  // Positions
  setPositions: (positions) => {
    const positionsRecord = positions.reduce(
      (acc, position) => {
        const key = `${position.instrument_id}:${position.position_side}`;
        acc[key] = position;
        return acc;
      },
      {} as Record<string, Position>,
    );
    set({ positions: positionsRecord });
  },

  updatePositions: (positions) => {
    const current = { ...get().positions };
    positions.forEach((position) => {
      const key = `${position.instrument_id}:${position.position_side}`;
      current[key] = position;
    });
    set({ positions: current });
  },

  updatePosition: (key, position) => {
    set({ positions: { ...get().positions, [key]: position } });
  },

  clearPositions: () => set({ positions: {} }),

  deletePosition: (instrument_id, position_side) => {
    const current = { ...get().positions };
    delete current[`${instrument_id}:${position_side}`];
    set({ positions: current });
  },

  // Leverage
  setLeverage: (instrument, leverage) => {
    set({ leverage: { ...get().leverage, [instrument]: leverage } });
  },

  clearLeverage: () => set({ leverage: {} }),
});
