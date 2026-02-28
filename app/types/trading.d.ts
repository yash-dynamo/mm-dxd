export interface TickerStats {
  change_24h: string;
  max_24h: string;
  min_24h: string;
  volume_24h: string;
}
export interface ChartBar {
  close: number;
  high: number;
  instrument_name: string;
  low: number;
  open: number;
  time: number;
  volume: number;
}

/**Global Trading Data */
export interface Instrument {
  stable_pair?: boolean;
  id: number;
  name: string;
  price_index: string;
  kind?: 'perps' | 'spot' | 'option';
  lot_size: number;
  tick_size: number;
  settlement_currency: number;
  only_isolated: boolean;
  max_leverage: number;
  delisted: boolean;
  min_notional_usd: number;
  margin_tiers: MarginTier[];
  listed_at_block_timestamp: number;
  margin_tiers: MarginTier[];
}

export interface MarginTier {
  notional_usd_threshold: string;
  max_leverage: number;
  mmr: number;
  mmd: number;
}

export interface Ticker {
  symbol: string;
  mark_price: string;
  mid_price?: string;
  index_price: string;
  last_price?: string;
  best_bid_price: string;
  best_ask_price: string;
  best_bid_size: string;
  best_ask_size: string;
  funding_rate: string;
  open_interest: string;
  last_updated: number;
  instrument_name: string;
  instrument_id: number;
  volume_24h?: number;
  change_24h?: number;
}

export interface Trade {
  instrument_id: number;
  instrument: string;
  trade_id: number;
  tx_hash: string;
  side: 's' | 'b';
  price: string;
  size: string;
  maker: string;
  taker: string;
  timestamp: number;
}

export interface Orderbook {
  bids: BookLevel[];
  asks: BookLevel[];
  instrument_name: string;
  timestamp: number;
  sequence_number: number;
}

export interface BookLevel {
  price: string;
  size: string;
}

export interface VaultSummary {
  apr: number;
  equity_daily: number[];
  shares: number;
  daily_nav_changes: number[];
}
/**User Trading Data */
export interface AccountSummary {
  address: Address;
  margin_mode: 'isolated' | 'cross';
  multi_asset_mode: boolean;
  hedge_mode: boolean;
  spot_collateral: {
    [key: string]: {
      balance: number;
      withdrawable_balance: number;
    };
  };
  collateral: {
    [key: string]: {
      balance: number;
      withdrawable_balance: number;
    };
  };
  vault_balances: Record<
    string,
    {
      withdrawable_shares: number;
      total_shares: number;
      amount: number;
    }
  >;
  staked_collateral: number;
  perp_positions: Record<string, PerpPosition>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leverage_override: any;
  initial_margin_utilization: number;
  maintenance_margin_utilization: number;
  upnl: number;
  total_account_equity: number;
  margin_balance: number;
  initial_margin: number;
  maintenance_margin: number;
  total_volume: number;
  total_pnl: number;
  available_balance: number;
  vault_summary?: VaultSummary;
  transfer_margin_req: number;
  max_drawdown: number;
  spot_account_equity: number;
  derivative_account_equity: number;
  spot_volume: number;
}

export interface Position {
  liquidation_price?: string;
  margin?: string;
  entry_price: string;
  instrument: string;
  instrument_id: number;
  leverage: string;
  margin_mode: string;
  position_side: string;
  position_value: string;
  size: string;
  updated_at: number;
  user: Address;
}

export interface UpdatedPosition {
  account: string;
  margin: string;
  instrument_id: number;
  instrument: string;
  position_type: 'oneWay' | 'hedge';
  old_position: {
    size: number;
    entry_price: number;
  };
  position_side_updated: 'LONG' | 'SHORT' | 'BOTH';
  realized_pnl: number;
  legs: PositionLeg[];
  block_timestamp: number;
}

export interface Leverage {
  type: 'cross' | 'isolated';
  value: number;
}

export interface PositionLeg {
  instrument_id: number;
  instrument_name: string;
  side: 'LONG' | 'SHORT' | 'BOTH';
  size: number;
  entry_price: number;
  leverage: Leverage;
  position_value: number;
  liquidation_price: number;
}

export interface Order {
  order_id: number;
  user: Address;
  instrument_id: number;
  instrument: string;
  side: 's' | 'b';
  limit_price: string;
  size: string;
  unfilled: string;
  state: 'open' | 'filled' | 'cancelled' | 'triggered';
  cloid: string;
  tif: 'GTC' | 'IOC' | 'FOK';
  tpsl: 'tp' | 'sl' | '';
  trigger_px: string;
  // in case of updates trigger_price is coming in the response instead of trigger_px
  trigger_price?: string;
  post_only: boolean;
  reduce_only: boolean;
  timestamp: string;
}

export interface OrderHistory {
  order_id: number;
  user: Address;
  instrument_id: number;
  instrument: string;
  side: 'b' | 's';
  limit_price: string;
  size: string;
  unfilled: string;
  state: 'cancelled' | 'filled' | 'open' | 'triggered';
  cloid: string;
  tif: 'GTC' | 'IOC' | 'FOK';
  post_only: boolean;
  reduce_only: boolean;
  timestamp: string;
}

export interface TradeHistory {
  instrument_id: number;
  instrument: string;
  account: Address;
  order_id: number;
  trade_id: number;
  side: 'b' | 's';
  direction: 'openLong' | 'openShort' | 'closeLong' | 'closeShort' | 'flipToShort' | 'flipToLong';
  position_side: string;
  price: string;
  start_price: string;
  start_size: string;
  size: string;
  closed_pnl: string;
  fee: string;
  broker_fee: string;
  fee_token_id: string;
  crossed: boolean;
  tx_hash: string;
  fill_type: number;
  notional_value?: string;
  block_timestamp: string | number;
  liquidation_info?: {
    liquidated_user: Address;
    method: string;
    liquidation_price: string;
    mark_price: string;
  };
}

export type AccountHistory = {
  created_at: string;
  account_value: string;
  total_pnl: string;
  total_volume?: string;
  perp_volume?: number;
  spot_volume?: number;
};

export interface UserVaultBalance {
  vault_address: string;
  account: string;
  amount: string;
  shares: string;
  updated_at: number;
}

export interface UserFees {
  account: string;
  spot_volume_14d: string;
  spot_volume_30d: string;
  stable_spot_volume_14d: string;
  stable_spot_volume_30d: string;
  perp_volume_14d: string;
  perp_volume_30d: string;
  option_volume_14d: string;
  option_volume_30d: string;
  total_volume_threshold: number;
  perp_maker_fee_rate: number;
  perp_taker_fee_rate: number;
  spot_maker_fee_rate: number;
  spot_taker_fee_rate: number;
  stable_spot_maker_fee_rate: number;
  stable_spot_taker_fee_rate: number;
  option_maker_fee_rate: number;
  option_taker_fee_rate: number;
}

export interface AgentWallet {
  user: Address;
  agent_address: Address;
  agent_name: string;
  created_at_block_timestamp: number;
  valid_until_timestamp: number;
}

export interface Fill {
  instrument_id: number;
  instrument: string;
  account: Address;
  order_id: number;
  trade_id: number;
  side: 'b' | 's';
  position_side: string;
  price: string;
  size: string;
  cloid: string;
  direction: 'openLong' | 'openShort' | 'closeLong' | 'closeShort' | 'flipToShort' | 'flipToLong';
  closed_pnl: string;
  fee: string;
  broker_fee: string;
  fee_token_id: string;
  crossed: boolean;
  tx_hash: string;
  fill_type: number;
  notional_value?: string;
  block_timestamp: string | number;
  liquidation_info?: {
    liquidated_user: Address;
    method: string;
    liquidation_price: string;
    mark_price: string;
  };
}

export interface CollateralTransaction {
  id: number;
  from: Address;
  to: Address;
  collateral_id: number;
  amount: string;
  tx_hash: string;
  type: string;
  timestamp: string;
}

export interface FundingPayment {
  user: Address;
  instrument_id: number;
  settlement_currency: number;
  funding_payment: string;
  final_balance: string;
  funding_rate: string;
  mark_price: string;
  timestamp: string;
  size: string;
}
export interface Block {
  block_hash: string;
  block_height: number;
  created_at: number;
  parent_hash: string;
  timestamp: number;
  tx_count: number;
}

export interface Transaction {
  block_hash: string;
  block_height: number;
  created_at: number;
  tx_hash: string;
  account: string;
  tx_type: number;
  success: boolean;
  timestamp: number;
  created_at: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  offset: number;
  limit: number;
}

export interface BlockDetail extends Block {
  transactions: Transaction[];
}

export interface OracleFeed {
  symbol: string;
  index_price: string;
  ext_mark_price: string;
  updated_at: number;
}

export interface SupportedCollateral {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  default_coll_weight: number;
  price_index: string;
  type: number;
  bridge_by_chain: {
    bridgeChainType: number;
    bridgeChainId: number;
    tokenAddress: string;
    bridgeContractAddress: string;
    enabled: boolean;
  }[];
  coll_risk: {
    weight_tiers: {
      amount: number;
      weight: number;
    }[];
    max_margin_cap: number;
    stale_price_guard_weight: number;
  }[];
  withdrawal_fee: number;
  added_at_block: number;
}

export interface PerpPosition {
  position_type: 'oneWay' | 'hedge';
  legs: PositionLeg[];
  liquidation_price: number;
  mm: number;
  im: number;
  upnl: number;
}

export interface Health {
  status: string;
  version: string;
  details: {
    [key: string]: boolean;
  };
}

export interface IAccountInfo {
  account: {
    address: Address,
    role: number,
    margin_mode: 'cross' | 'isolated',
    multi_asset_mode: boolean,
    hedge_mode: boolean,
    referrer: Address,
    referral_codes: string[],
    referral_timestamp: number,
    created_at_block_timestamp: number,
  },
  rewards: {
    account: Address,
    collateral_id: number,
    source: string,
    is_spot: boolean,
    amount: string,
    claim_amount: string,
    created_at: number,
  }[],
  history: {
    account: Address,
    collateral_id: number,
    source: string,
    is_spot: boolean,
    amount: string,
    claim_amount: string,
    created_at: number,
  }[],
}


export interface IReferralSummary {
  address: Address;
  referrer: Address;
  referrer_code: string;
  refer_timestamp: number;
  is_affiliate: boolean;
  codes: string[];
  referred_users: Record<Address, ReferredUser>;
  to_claim_perp_rewards: number;
  to_claim_spot_rewards: number;
  claimed_perp_rewards: number;
  claimed_spot_rewards: number;
  total_referred_volume: number;
  referral_tier: {
    total_referred_volume: number;
    fee_discount_rate: number;
    referrer_commission: number;
  };
  updated_at: number;
}

export interface ReferredUser {
  address?: Address;
  code: string;
  joined_at: number;
  referred_volume: number;
  perp_volume: VolumeData;
  spot_volume: VolumeData;
  stable_spot_volume: VolumeData;
  referred_perp_rewards: number;
  referred_spot_rewards: number;
}
