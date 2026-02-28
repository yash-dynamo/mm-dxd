import { AccountSummary, Position, Order, OrderHistory, TradeHistory } from './trading';

export interface SubVault {
  created_at: number;
  manager: string;
  sub_vault_address: string;
  vault_address?: string;
  address?: string;
}
export interface Vault {
  created_at: number;
  name: string;
  role: number;
  symbol: string;
  underlying_asset_id: number;
  vault_address: string;
  vault_manager: string;
  account_summary?: AccountSummary;
  positions?: Record<string, Position>;
  open_orders?: Order[];
  order_history?: OrderHistory[];
  trade_history?: TradeHistory[];
}
