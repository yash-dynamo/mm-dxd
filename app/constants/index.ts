import { Address } from 'viem';

export const DEFAULT_MIN_AMOUNT = 5;
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const L2_CHAIN_ID = 421614;

export const EXCHANGE_NAME = 'Hotstuff';

export const CONTRACTS: Record<string, Address> = {
  COLLATERAL_POOL: '0x29638091AAe92293408cE7D47b34Ca37E166aF0e',
  SPOT_ACCOUNT_MANAGER: '0x386Ac63e54a66632cc58F887c3d0a0cCB3Cc8251',
};

export const MAX_EQUITY_VAULT = 1000000;
export const subVaultsToUse = ['0x3212B884EED6D6CFe60742fA0c47326E48b45E25'];

export const REFERRAL_THRESHOLD = 10000;
export const SET_REFERRER_THRESHOLD = 25000000;

export * from './expedition';
