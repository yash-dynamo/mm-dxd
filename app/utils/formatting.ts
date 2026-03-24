import { Address, getAddress } from 'viem';

/**
 * Normalize wallet addresses to checksum format.
 * Keeps auth/store comparisons consistent even if a connector returns lowercase.
 */
export const normalizeAddress = (address: Address): Address => {
  try {
    return getAddress(address) as Address;
  } catch {
    return address;
  }
};

/**
 * Convert `camelCase`/`PascalCase` action keys to human-readable titles.
 * Example: `accountSpotWithdrawRequest` -> `Account Spot Withdraw Request`.
 */
export function camelToTitleCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}
