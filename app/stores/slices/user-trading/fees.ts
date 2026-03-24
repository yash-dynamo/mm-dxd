import { StateCreator } from 'zustand';
import { UserFees } from '@/types/trading';

// ─── Types ────────────────────────────────────────────────────────────────────

// Defined locally so the store works without the product pages importing TradingType.
type TradingType = 'perps' | 'spot';

export interface FeesState {
  userFees: UserFees;
}

export interface FeesActions {
  setUserFees: (userFees: UserFees) => void;
  updateUserFees: (userFees: UserFees) => void;
  clearUserFees: () => void;

  /** Returns raw numeric maker/taker rates (already multiplied by 100) */
  getFeeRatesRaw: (
    tradingType: TradingType,
    userFees: UserFees,
    isStableSpot: boolean,
  ) => { makerRate: number; takerRate: number };

  /** Returns a formatted "taker% / maker%" string, or "-- / --" when unavailable */
  getFeeRates: (tradingType: TradingType, userFees: UserFees, isStableSpot: boolean) => string;
}

type FeesSlice = FeesState & FeesActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const emptyUserFees: UserFees = {
  account: '',
  spot_volume_14d: '0',
  spot_volume_30d: '0',
  stable_spot_volume_14d: '0',
  stable_spot_volume_30d: '0',
  perp_volume_14d: '0',
  perp_volume_30d: '0',
  option_volume_14d: '0',
  option_volume_30d: '0',
  total_volume_threshold: 0,
  perp_maker_fee_rate: 0,
  perp_taker_fee_rate: 0,
  spot_maker_fee_rate: 0,
  spot_taker_fee_rate: 0,
  stable_spot_maker_fee_rate: 0,
  stable_spot_taker_fee_rate: 0,
  option_maker_fee_rate: 0,
  option_taker_fee_rate: 0,
};

const initialState: FeesState = {
  userFees: emptyUserFees,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createFeesSlice: StateCreator<FeesSlice> = (set, get) => ({
  ...initialState,

  setUserFees: (userFees) => set({ userFees }),

  updateUserFees: (userFees) => set({ userFees: { ...get().userFees, ...userFees } }),

  clearUserFees: () => set({ userFees: emptyUserFees }),

  getFeeRatesRaw: (tradingType, userFees, isStableSpot) => {
    if (!userFees.account) return { makerRate: 0, takerRate: 0 };

    if (tradingType === 'perps') {
      return {
        makerRate: userFees.perp_maker_fee_rate * 100,
        takerRate: userFees.perp_taker_fee_rate * 100,
      };
    }

    if (isStableSpot) {
      return {
        makerRate: userFees.stable_spot_maker_fee_rate * 100,
        takerRate: userFees.stable_spot_taker_fee_rate * 100,
      };
    }

    return {
      makerRate: userFees.spot_maker_fee_rate * 100,
      takerRate: userFees.spot_taker_fee_rate * 100,
    };
  },

  getFeeRates: (tradingType, userFees, isStableSpot) => {
    const fees = get().getFeeRatesRaw(tradingType, userFees, isStableSpot);
    if (fees.makerRate === 0 && fees.takerRate === 0) return '-- / --';
    return `${fees.takerRate.toFixed(4)}% / ${fees.makerRate.toFixed(4)}%`;
  },
});
