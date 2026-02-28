import { subVaultsToUse } from '@/constants';
import { AccountSummary, PerpPosition } from '@/types/trading';

export const safeFloat = (s: string | number): number => {
  if (typeof s === 'number') return s;
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

/**
 * Validates a price string and returns it if valid, undefined otherwise.
 * Treats '0', empty strings, invalid numbers, or non-positive values as unavailable.
 * @param price - The price string to validate
 * @returns The price string if valid, undefined otherwise
 */
export const getValidPrice = (price?: string): string | undefined => {
  if (!price || price === '0' || Number(price) <= 0 || isNaN(Number(price))) {
    return undefined;
  }
  return price;
};

export const getCryptoIcon = (symbol: string) => {
  let symbolName = symbol.toUpperCase();
  if (symbol.includes('-')) {
    symbolName = symbolName.split('-')[0];
  }
  if (symbol.includes('/')) {
    symbolName = symbolName.split('/')[0];
  }
  return `/imgs/svg/crypto/${symbolName}.svg`;
};

export const getBalanceKey = (instrument: string, side: string) => {
  if (instrument.includes('/')) {
    const [base, quote] = instrument.split('/');
    if (side === 'b') {
      return `${quote}`;
    } else {
      return `${base}`;
    }
  }
  return instrument;
};

export const getBalance = (
  kind: string,
  instrument: string,
  side: string,
  accountSummary: AccountSummary,
) => {
  if (kind === 'spot') {
    const instrumentKey = getBalanceKey(instrument, side);
    return accountSummary?.spot_collateral[instrumentKey]?.withdrawable_balance || 0;
  } else {
    return accountSummary.available_balance < 0 ? 0 : accountSummary.available_balance;
  }
};

export const getBalanceValue = (collateral: {
  [key: string]: { balance: number; withdrawable_balance: number };
}) => {
  return Object.values(collateral).reduce((acc, curr) => acc + curr.balance, 0);
};

export const getCrossAccountLeverage = (
  positions: Record<string, PerpPosition>,
  portfolioNotionalValue: number,
) => {
  if (portfolioNotionalValue === 0) return 0;

  const totalPositionValue = Object.values(positions).reduce((acc, curr) => {
    return acc + curr.legs.reduce((legAcc, leg) => legAcc + leg.position_value, 0);
  }, 0);

  return totalPositionValue / portfolioNotionalValue;
};

export const getSubVaultAdresses = (subVaultAddr: string[]) => {
  return subVaultAddr.filter((subVault) => subVaultsToUse.includes(subVault));
};
