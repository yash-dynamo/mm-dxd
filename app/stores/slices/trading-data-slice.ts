import { StateCreator } from 'zustand';
import { Instrument, OracleFeed, SupportedCollateral, Ticker, Trade } from '@/types/trading';

export interface TradingDataState {
  tickers: Record<string, Ticker>;
  instruments: Record<string, Instrument>;
  trades: Trade[];
  limitPrice: string;
  oracleFeed: Record<string, OracleFeed>;
  supportedCollateral: Record<string, SupportedCollateral>;
}

export interface TradingDataActions {
  getTicker: (instrumentName: string) => Ticker | undefined;
  updateTicker: (instrumentName: string, ticker: Ticker) => void;
  getInstrument: (instrumentName: string) => Instrument;
  getInstrumentById: (instrumentId: number) => Instrument;
  updateInstrument: (instrumentName: string, instrument: Instrument) => void;
  getInstruments: () => Instrument[];
  selectedInstrument: string;
  setSelectedInstrument: (instrumentName: string) => void;
  updateInstruments: (instruments: Record<string, Instrument[]>) => void;
  clearInstruments: () => void;
  getTrades: () => Trade[];
  setTrades: (trades: Trade[]) => void;
  updateTrades: (trades: Trade) => void;
  clearTrades: () => void;
  setLimitPrice: (limitPrice: string) => void;
  setOracleFeed: (oracleFeed: OracleFeed) => void;
  updateOracleFeed: (oracleFeed: OracleFeed) => void;
  clearOracleFeed: () => void;
  setSupportedCollateral: (supportedCollaterals: SupportedCollateral[]) => void;
  getSupportedCollateral: (symbol: string) => SupportedCollateral | undefined;
  clearSupportedCollateral: () => void;
}

export type TradingDataStoreState = TradingDataState & TradingDataActions;

export const createTradingDataSlice: StateCreator<TradingDataStoreState> = (set, get) => ({
  tickers: {},
  instruments: {},
  trades: [],
  selectedInstrument: '',
  limitPrice: '',
  oracleFeed: {
    USDC: {
      symbol: 'USDT/USDC',
      index_price: '1.00000000',
      ext_mark_price: '1.00000000',
      updated_at: 0,
    },
  },
  supportedCollateral: {},

  setSelectedInstrument: (instrumentName: string) => {
    set({ selectedInstrument: instrumentName });
  },

  getInstrument: (instrumentName: string) => {
    const { instruments } = get();
    return instruments[instrumentName];
  },

  getInstrumentById: (instrumentId: number) => {
    const { instruments } = get();
    const instrument = Object.values(instruments).find(
      (instrument) => instrument.id === instrumentId,
    ) as Instrument;
    return instrument;
  },

  updateInstrument: (instrumentName: string, instrument: Instrument) => {
    set({
      instruments: { ...get().instruments, [instrumentName]: instrument },
    });
  },

  getInstruments: () => {
    const { instruments } = get();
    return Object.values(instruments);
  },

  updateInstruments: (instruments: Record<string, Instrument[]>) => {
    const instrumentsRecord: Record<string, Instrument> = {};

    Object.entries(instruments).forEach(([kind, instrumentArray]) => {
      instrumentArray.forEach((instrument) => {
        instrumentsRecord[instrument.name] = {
          ...instrument,
          kind: kind as 'perps' | 'spot' | 'option',
        };
      });
    });

    set({ instruments: { ...get().instruments, ...instrumentsRecord } });
  },

  clearInstruments: () => {
    set({ instruments: {} });
  },

  getTicker: (instrumentName: string) => {
    const { tickers } = get();
    return tickers[instrumentName];
  },

  updateTicker: (instrumentName: string, ticker: Ticker) => {
    set({ tickers: { ...get().tickers, [instrumentName]: ticker } });

    // Verify it was set
    const stored = get().tickers[instrumentName];
  },

  getTrades: () => {
    const { trades } = get();
    return trades;
  },

  setTrades: (trades: Trade[]) => {
    set({ trades: [...get().trades, ...trades].slice(0, 20) });
  },

  updateTrades: (trades: Trade) => {
    set({ trades: [trades, ...get().trades].slice(0, 20) });
  },

  clearTrades: () => {
    set({ trades: [] });
  },

  setLimitPrice: (limitPrice: string) => {
    set({ limitPrice });
  },

  setOracleFeed: (oracleFeed: OracleFeed) => {
    set({ oracleFeed: { ...get().oracleFeed, [oracleFeed.symbol.split('/')[0]]: oracleFeed } });
  },

  updateOracleFeed: (oracleFeed: OracleFeed) => {
    set({ oracleFeed: { ...get().oracleFeed, [oracleFeed.symbol.split('/')[0]]: oracleFeed } });
  },

  clearOracleFeed: () => {
    set({ oracleFeed: {} });
  },

  setSupportedCollateral: (supportedCollaterals: SupportedCollateral[]) => {
    const supportedCollateralRecord: Record<string, SupportedCollateral> = {};
    supportedCollaterals.forEach((supportedCollateral) => {
      supportedCollateralRecord[supportedCollateral.symbol] = supportedCollateral;
    });
    set({ supportedCollateral: { ...get().supportedCollateral, ...supportedCollateralRecord } });
  },

  getSupportedCollateral: (symbol: string) => {
    const { supportedCollateral } = get();
    return supportedCollateral[symbol];
  },

  clearSupportedCollateral: () => {
    set({ supportedCollateral: {} });
  },
});
