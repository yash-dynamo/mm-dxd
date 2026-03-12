import { camelToTitleCase } from '@/utils/formatting';
import { tradeActions } from './trade';
import { transferActions } from './transfer';
import { accountActions } from './account';
import { vaultActions } from './vault';

export type ActionContext<T = unknown> = {
  data?: T;
  error?: string;
  [key: string]: unknown;
};

export type ToastParams = {
  title: string;
  description?: string;
  error?: boolean;
};

export type ActionHandler<T = unknown> =
  | ToastParams
  | ((context?: ActionContext<T>) => ToastParams | Promise<ToastParams>);

export type config<T = unknown> = {
  name: string;
  success?: ActionHandler<T>;
  error?: ActionHandler<T>;
  loading?: ToastParams;
};

export const actions: Record<string, config> = {
  ...tradeActions,
  ...transferActions,
  ...accountActions,
  ...vaultActions,
};

// NOTE: @hotstuff-labs/ts-sdk@0.0.1-beta.10 does not export op codes from the package root.
// Keep this local map aligned with the SDK's internal `EXCHANGE_OP_CODES`.
const EXCHANGE_OP_CODES: Record<string, number> = {
  addAgent: 1201,
  revokeAgent: 1211,
  updatePerpInstrumentLeverage: 1203,
  approveBrokerFee: 1207,
  createReferralCode: 1208,
  setReferrer: 1209,
  claimReferralRewards: 1210,
  placeOrder: 1301,
  cancelByOid: 1302,
  cancelAll: 1311,
  cancelByCloid: 1312,
  accountSpotWithdrawRequest: 1002,
  accountDerivativeWithdrawRequest: 1003,
  accountSpotBalanceTransferRequest: 1051,
  accountDerivativeBalanceTransferRequest: 1052,
  accountInternalBalanceTransferRequest: 1053,
  depositToVault: 1401,
  redeemFromVault: 1402,
};

export const actionsMapByCode = Object.fromEntries(
  Object.entries(EXCHANGE_OP_CODES).map(([key, value]) => [value, key]),
);

export const actionNamesByCode = Object.fromEntries(
  Object.entries(EXCHANGE_OP_CODES).map(([key, value]) => [value, camelToTitleCase(key)]),
);
