import { StateCreator } from 'zustand';
import { ITier } from '@/types/expedition';
import { DEFAULT_INITIAL_TIER } from '@/constants/expedition';

export interface ExpeditionDataState {
  activeTier: ITier | null;
  completedMilestones: Set<string>;
  loading: boolean;
}

export interface ExpeditionDataActions {
  setActiveTier: (activeTier: ITier) => void;
  setCompletedMilestones: (milestoneIds: Set<string>) => void;
  setLoading: (loading: boolean) => void;
  clearExpedition: () => void;
}

export type ExpeditionDataStoreState = ExpeditionDataState & ExpeditionDataActions;

export const createExpeditionDataSlice: StateCreator<ExpeditionDataStoreState> = (set) => ({
  activeTier: DEFAULT_INITIAL_TIER,
  completedMilestones: new Set<string>(),
  loading: false,

  setActiveTier: (activeTier: ITier) => set({ activeTier }),

  setCompletedMilestones: (milestoneIds: Set<string>) => set({ completedMilestones: milestoneIds }),

  setLoading: (loading: boolean) => set({ loading }),

  clearExpedition: () =>
    set({ activeTier: null, completedMilestones: new Set<string>() }),
});
