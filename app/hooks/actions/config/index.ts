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

import { ACTIONS_OP_CODES } from '@0xsyndr/ts-sdk';

export const actionsMapByCode = Object.fromEntries(
  Object.entries(ACTIONS_OP_CODES).map(([key, value]) => [value, key]),
);

export const actionNamesByCode = Object.fromEntries(
  Object.entries(ACTIONS_OP_CODES).map(([key, value]) => [value, camelToTitleCase(key)]),
);
