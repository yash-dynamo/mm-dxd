import { isMainnet } from '@/config';
import { ITier } from '@/types/expedition';

import { MAINNET_EXPEDITION_TIERS } from './mainnet/tiers';
import { TESTNET_EXPEDITION_TIERS } from './testnet/tiers';

/**
 * Environment-aware expedition tiers.
 * Since milestones no longer import store-dependent checker functions,
 * there is no circular dependency and we can import directly.
 */
export const EXPEDITION_TIERS: ITier[] = isMainnet
  ? MAINNET_EXPEDITION_TIERS
  : TESTNET_EXPEDITION_TIERS;

/**
 * Default initial tier for store initialization.
 */
export const DEFAULT_INITIAL_TIER: ITier = EXPEDITION_TIERS[0];

// Re-export for consumers that need specific network tiers
export { MAINNET_EXPEDITION_TIERS } from './mainnet/tiers';
export { TESTNET_EXPEDITION_TIERS } from './testnet/tiers';
