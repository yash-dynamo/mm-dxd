import { Instrument } from '@/types/trading';

export const DEFAULT_INSTRUMENTS: Record<string, Instrument[]> = {
  perps: [
    {
      id: 1,
      name: 'BTC-PERP',
      price_index: 'BTC/USDT',
      lot_size: 0.001,
      tick_size: 0.01,
      settlement_currency: 1,
      only_isolated: false,
      max_leverage: 50,
      delisted: false,
      min_notional_usd: 0.1,
      margin_tiers: [
        {
          notional_usd_threshold: '10000',
          max_leverage: 40,
          mmr: 0.0125,
          mmd: 0,
        },
        {
          notional_usd_threshold: '50000',
          max_leverage: 25,
          mmr: 0.02,
          mmd: 75,
        },
        {
          notional_usd_threshold: '100000',
          max_leverage: 10,
          mmr: 0.05,
          mmd: 1575,
        },
        {
          notional_usd_threshold: '300000',
          max_leverage: 5,
          mmr: 0.1,
          mmd: 6575,
        },
        {
          notional_usd_threshold: '9223372036854.775',
          max_leverage: 3,
          mmr: 0.166666,
          mmd: 26574.8,
        },
      ],
      listed_at_block_timestamp: 1758181243891,
    },
  ],
};
