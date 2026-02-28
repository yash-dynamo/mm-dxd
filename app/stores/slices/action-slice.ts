import { StateCreator } from 'zustand';

export interface ActionState {
  modal: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  isLoading: boolean;
}

export interface ActionActions {
  setModal: (modal: string | null) => void;
  setPayload: (payload: unknown) => void;
  setLoading: (loading: boolean) => void;
}

export type ActionStoreState = ActionState & ActionActions;

export const createActionSlice: StateCreator<ActionStoreState> = (set) => ({
  modal: null,
  payload: null,
  isLoading: false,

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setModal: (modal: string | null) => {
    set({ modal });
  },

  setPayload: (payload: unknown) => {
    set({ payload });
  },
});
