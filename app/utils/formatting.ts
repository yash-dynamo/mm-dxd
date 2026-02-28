import { useTradingDataStore } from '@/stores';
import { Address, getAddress } from 'viem';

/**
 * Normalizes an address to proper checksummed hex format.
 * This fixes issues with WalletConnect (mobile MetaMask) sending
 * non-standard address formats.
 */
export const normalizeAddress = (address: Address): Address => {
  try {
    return getAddress(address) as Address;
  } catch {
    // If getAddress fails, return as-is (shouldn't happen with valid addresses)
    return address;
  }
};

export function formatWalletAddress(
  address?: string,
  startChars: number = 6,
  endChars: number = 4,
): string {
  if (!address) return '';

  // Handle addresses shorter than the combined length
  if (address.length <= startChars + endChars) {
    return address;
  }

  const start: string = address.substring(0, startChars);
  const end: string = address.substring(address.length - endChars);

  return `${start}...${end}`;
}

/**
 * Calculate the number of decimal places from a numeric value
 * @param value - The numeric value (e.g., 0.1, 0.01, 0.05, 0.001)
 * @param type - Determines the algorithm to use ('tick' or 'contract')
 * @returns The number of decimal places
 */
export function getDecimalsFromValue(
  value: number | string | undefined,
  type: 'tick' | 'contract' = 'tick',
): number {
  if (value === undefined || value === 0) {
    return 0;
  }

  // Convert to string for easier handling
  const valueStr = value.toString();
  const decimalIndex = valueStr.indexOf('.');

  // No decimal point found, or it's a value like "1"
  if (decimalIndex === -1 || valueStr === '1') {
    return 0;
  }

  // For scientific notation like 1e-5
  const scientificMatch = valueStr.match(/e-(\d+)/i);
  if (scientificMatch) {
    return parseInt(scientificMatch[1], 10);
  }

  // Process based on type
  if (type === 'tick') {
    // Standard decimal (0.1, 0.01, etc.)
    // Count significant digits after decimal point
    let decimals = valueStr.length - decimalIndex - 1;

    // Handle trailing zeros (e.g., 0.100)
    if (valueStr.endsWith('0')) {
      const match = valueStr.match(/\.(\d*?)0*$/);
      if (match && match[1]) {
        decimals = match[1].length;
      }
    }

    return decimals;
  } else {
    // For contract size type (0.5, 0.1, 0.05, etc.)
    // Calculate appropriate precision for better readability
    const precision = valueStr.length - decimalIndex - 1;

    // Determine the smallest non-zero digit place
    const decimalPart = valueStr.substring(decimalIndex + 1);
    let significantDigit = -1;

    for (let i = 0; i < decimalPart.length; i++) {
      if (decimalPart[i] !== '0') {
        significantDigit = i;
        break;
      }
    }

    // Add at least 1 extra decimal place for better readability
    return significantDigit >= 0 ? significantDigit + 2 : precision;
  }
}

export interface FormatNumberOptions {
  currency?: string;
  decimals?: number;
  useGrouping?: boolean;
  locale?: string;
  trimTrailingZeros?: boolean;
  useTickSize?: boolean; // When true, use tickSize for determining decimals and rounding
  useContractSize?: boolean; // When true, use contract size for determining decimals and rounding
  instrument_name?: string;
  maxDecimals?: number;
  fallback?: string;
  preserveDecimalString?: boolean; // When true, preserves the original string format for decimal numbers
  suffix?: string;
  isPercentage?: boolean;
  debug?: boolean;
  defaultTickSize?: number;
  defaultContractSize?: number;
  floor?: boolean; // When true, floor instead of round to tick/contract size
}

export function formatNumber(
  value: number | string | undefined,
  options: FormatNumberOptions = {},
): string {
  // Set default options
  const {
    currency = '',
    decimals = 2,
    useGrouping = true,
    locale = 'en-US',
    trimTrailingZeros = true,
    instrument_name = '',
    useTickSize = false,
    useContractSize = false,
    maxDecimals,
    fallback = '',
    preserveDecimalString = false,
    suffix = '',
    defaultTickSize = 0.01,
    defaultContractSize = 0.0001,
    debug = false,
    floor = false,
  } = options;

  // @todo: temp commented out before adding store
  const tickSize = Number(
    useTradingDataStore.getState().getInstrument(instrument_name)?.tick_size || defaultTickSize,
  );

  const contractSize = Number(
    useTradingDataStore.getState().getInstrument(instrument_name)?.lot_size || defaultContractSize,
  );

  // Determine the number of decimals to use
  let effectiveDecimals = decimals;

  // Calculate decimals based on tickSize or contractSize
  if (useTickSize && tickSize !== undefined) {
    effectiveDecimals = getDecimalsFromValue(tickSize, 'tick');
  } else if (useContractSize && contractSize !== undefined) {
    effectiveDecimals = getDecimalsFromValue(contractSize, 'contract');
  }

  // Special case for preserving decimal string format
  // This keeps the exact string representation of decimal numbers when needed
  if (preserveDecimalString && typeof value === 'string') {
    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1) {
      const maxDecimalPlaces = maxDecimals !== undefined ? maxDecimals : effectiveDecimals;
      const decimalPart = value.slice(decimalIndex + 1);
      if (decimalPart.length > maxDecimalPlaces) {
        return value.slice(0, decimalIndex + maxDecimalPlaces + 1);
      }
    }
    return value;
  }

  // Convert string to number if needed
  let numValue: number;

  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    // Handle empty or non-numeric strings
    if (!value || isNaN(Number(value))) {
      return fallback;
    }
    numValue = Number(value);
  } else {
    numValue = value;
  }

  // Check if value is a valid number
  if (!isFinite(numValue)) {
    return fallback;
  }

  const roundingFn = floor ? Math.floor : Math.round;

  // Round to tick size if useTickSize is enabled
  if (useTickSize && tickSize && tickSize > 0) {
    numValue = roundingFn(numValue / tickSize) * tickSize;
  }

  // Round to contract size if useContractSize is enabled
  if (useContractSize && contractSize && contractSize > 0) {
    numValue = roundingFn(numValue / contractSize) * contractSize;
  }

  // Format the number
  const finalDecimals =
    maxDecimals !== undefined ? Math.min(effectiveDecimals, maxDecimals) : effectiveDecimals;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: trimTrailingZeros ? 0 : finalDecimals,
    maximumFractionDigits: finalDecimals,
    useGrouping,
  });

  let formatted = formatter.format(numValue);

  // Add currency symbol if provided
  if (currency) {
    // Handle negative numbers by moving the minus sign before the currency

    if (numValue < 0) {
      formatted = formatted.replace('-', '');
      const formmattedNumVal = parseFloat(formatted.replaceAll(',', ''));
      if (formmattedNumVal === 0) {
        formatted = `${currency}${formatted}`;
      } else {
        formatted = `-${currency}${formatted}`;
      }
    } else {
      formatted = `${currency}${formatted}`;
    }
  }

  if (suffix) {
    formatted = `${formatted}${suffix}`;
  }

  return formatted;
}

export function formatAbbreviatedNumber(
  value: number | string | undefined,
  options: { currency?: string; fallback?: string } = {},
): string {
  const { currency = '', fallback = '' } = options;

  if (value === undefined) {
    return fallback || (currency ? `${currency}0` : '0');
  }

  let numValue: number;
  if (typeof value === 'string') {
    if (!value || isNaN(Number(value))) {
      return fallback || (currency ? `${currency}0` : '0');
    }
    numValue = Number(value);
  } else {
    numValue = value;
  }

  if (!isFinite(numValue) || numValue === 0) {
    return fallback || (currency ? `${currency}0` : '0');
  }

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';

  let formatted: string;

  if (absValue >= 1000000000000) {
    formatted = `${(absValue / 1000000000000).toFixed(2)}T`;
  } else if (absValue >= 1000000000) {
    formatted = `${(absValue / 1000000000).toFixed(1)}B`;
  } else if (absValue >= 1000000) {
    formatted = `${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `${(absValue / 1000).toFixed(1)}K`;
  } else {
    return formatNumber(numValue, { currency, decimals: 0, fallback });
  }

  formatted = formatted.replace(/\.00?([KMBT])$/, '$1');

  if (currency) {
    return `${sign}${currency}${formatted}`;
  }

  return `${sign}${formatted}`;
}

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format a date/timestamp to relative time (e.g., "500 ms ago", "5 min ago")
 * @param date - Date object, timestamp (ms), or ISO string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date | number | string): string => {
  const timestamp =
    date instanceof Date
      ? date.getTime()
      : typeof date === 'string'
        ? new Date(date).getTime()
        : date;

  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInSeconds = Math.floor(diffInMs / 1000);

  if (diffInSeconds < 0) return 'just now';
  if (diffInSeconds === 0) return `${diffInMs} ms ago`;
  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

export function formatKeyExpiration(expiresAt: bigint | string) {
  const expiresAtStr = expiresAt.toString();

  // Check if it's the max uint256 value (never expires)
  if (
    expiresAtStr ===
    '115792089237316195423570985008687907853269984665640564039457584007913129639935'
  ) {
    return {
      dateDisplay: 'Never',
      timeDisplay: '∞',
      fullDisplay: 'Never expires',
    };
  }

  try {
    // Convert expiresAt to a number if it's a reasonable value
    const expiresAtBigInt = typeof expiresAt === 'string' ? BigInt(expiresAt) : expiresAt;

    if (expiresAtBigInt <= BigInt(8640000000000)) {
      const date = new Date(Number(expiresAtBigInt) * 1000);

      if (!isNaN(date.getTime())) {
        const formattedDate = formatNumber(date.getTime(), {
          useGrouping: false,
          fallback: 'Invalid date',
        });

        // Format time as HH:mm:ss
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        return {
          dateDisplay: formattedDate,
          timeDisplay: formattedTime,
          fullDisplay: formattedDate,
        };
      }
    }

    return {
      dateDisplay: 'Invalid date',
      timeDisplay: '-',
      fullDisplay: 'Invalid date',
    };
  } catch (error) {
    console.error('Error formatting expiration timestamp:', error);
    return {
      dateDisplay: 'Error',
      timeDisplay: 'Error',
      fullDisplay: 'Error',
    };
  }
}

export function camelToTitleCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([A-Z])/g, ' $1') // Add space before each capital letter
    .replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Format a timestamp for table display
 * Output format: "MM/DD/YY- HH:MM AM/PM"
 * @param timestamp - Date, timestamp in ms, or ISO string
 * @returns Formatted date-time string
 */
export const formatTableDateTime = (timestamp: string | number | Date): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date
    .toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', '-');
};
