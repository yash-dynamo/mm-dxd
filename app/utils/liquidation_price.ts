import { AccountSummary, MarginTier } from '@/types/trading';

const BASE_TAKER_FEE = 0.00025;

export const getLiquidationPrice = (
  summary: AccountSummary,
  instrumentName: string,
  size: number,
  mark_price: number,
  limit_price: number,
  leverage: number,
  is_market: boolean,
  margin_tiers: MarginTier[],
): { longLiquidationPrice: number; shortLiquidationPrice: number } => {
  if (!instrumentName.includes('PERP')) {
    return { longLiquidationPrice: 0, shortLiquidationPrice: 0 };
  }
  let longLiquidationPrice = 0;
  let shortLiquidationPrice = 0;

  const existingPosition = summary.perp_positions?.[instrumentName] || null;

  let available_balance = Math.max(0, summary.available_balance);
  const notional_value = size * limit_price;

  if (is_market) {
    //deduct slippage from available balance
    available_balance -= Math.abs(size) * Math.abs(limit_price - mark_price);
  }

  if (existingPosition) {
    const legs = existingPosition.legs;
    let net_size = 0;
    for (const leg of legs) {
      net_size += leg.size;
    }
    const existing_notional_value = Math.abs(net_size) * mark_price;
    let long_notional_value = 0;
    let short_notional_value = 0;

    const existing_notional_im = existing_notional_value / leverage;
    available_balance += existing_notional_im;

    if (net_size > 0) {
      long_notional_value = existing_notional_value + notional_value;
      if (size < net_size) {
        short_notional_value = 0;
      } else {
        short_notional_value = Math.abs(existing_notional_value - notional_value);
      }
    } else {
      short_notional_value = existing_notional_value + notional_value;
      if (size < Math.abs(net_size)) {
        long_notional_value = 0;
      } else {
        long_notional_value = Math.abs(existing_notional_value - notional_value);
      }
    }

    const long_initial_margin = long_notional_value / leverage;
    const short_initial_margin = short_notional_value / leverage;
    const { margin_rate: long_margin_rate, deduction: long_deduction } = getMarginRateAndDeduction(
      long_notional_value,
      margin_tiers,
    );
    var long_maintenance_margin = long_notional_value * long_margin_rate - long_deduction;
    const long_fees = long_notional_value * BASE_TAKER_FEE * 2;
    long_maintenance_margin += long_fees;
    const { margin_rate: short_margin_rate, deduction: short_deduction } =
      getMarginRateAndDeduction(short_notional_value, margin_tiers);
    var short_maintenance_margin = short_notional_value * short_margin_rate - short_deduction;
    const short_fees = short_notional_value * BASE_TAKER_FEE * 2;
    short_maintenance_margin += short_fees;

    const long_max_loss_factor = getMaxLossFactor(
      available_balance,
      long_initial_margin,
      long_maintenance_margin,
      size,
    );
    if (long_notional_value > 0) {
      longLiquidationPrice = Math.max(0, limit_price - long_max_loss_factor);
    } else {
      longLiquidationPrice = 0;
    }
    const short_max_loss_factor = getMaxLossFactor(
      available_balance,
      short_initial_margin,
      short_maintenance_margin,
      size,
    );
    if (short_notional_value > 0) {
      shortLiquidationPrice = limit_price + short_max_loss_factor;
    } else {
      shortLiquidationPrice = 0;
    }
  } else {
    //create a new position
    const initial_margin = notional_value / leverage;
    const { margin_rate, deduction } = getMarginRateAndDeduction(notional_value, margin_tiers);
    var maintenance_margin = notional_value * margin_rate - deduction;
    const fees = notional_value * BASE_TAKER_FEE * 2;
    maintenance_margin += fees;

    const max_loss_factor = getMaxLossFactor(
      available_balance,
      initial_margin,
      maintenance_margin,
      size,
    );
    longLiquidationPrice = Math.max(0, limit_price - max_loss_factor);
    shortLiquidationPrice = limit_price + max_loss_factor;
  }

  return { longLiquidationPrice, shortLiquidationPrice };
};

const getMarginRateAndDeduction = (
  notional_value: number,
  margin_tiers: any,
): { margin_rate: number; deduction: number } => {
  const margin_rate = margin_tiers.find(
    (tier: any) => notional_value < Number(tier.notional_usd_threshold),
  );
  if (!margin_rate) {
    return {
      margin_rate: margin_tiers[margin_tiers.length - 1].mmr,
      deduction: margin_tiers[margin_tiers.length - 1].mmd,
    };
  }
  return { margin_rate: margin_rate.mmr, deduction: margin_rate.mmd };
};

const getMaxLossFactor = (
  available_balance: number,
  initial_margin: number,
  maintenance_margin: number,
  size: number,
): number => {
  // Validate inputs
  if (
    !Number.isFinite(available_balance) ||
    !Number.isFinite(maintenance_margin) ||
    !Number.isFinite(size)
  ) {
    return NaN;
  }

  if (size === 0 || Math.abs(size) < 1e-10) {
    return NaN;
  }

  const numerator = available_balance - maintenance_margin;
  if (!Number.isFinite(numerator)) {
    return NaN;
  }

  const result = numerator / size;
  return Number.isFinite(result) ? result : NaN;
};

/**
 * Binary search to find max size where at least one side (long/short) can be opened.
 * Returns the maximum size that doesn't cause BOTH buy and sell to be invalid due to
 * liquidation price constraints.
 * 
 * @param getLimitPriceFn Optional function to calculate limit price for a given size and side.
 *                        If provided, this will be used instead of fixed limitPriceLong/limitPriceShort.
 *                        This allows recalculating slippage for each size being tested.
 */
export const getMaxValidSizeForLiquidation = (
  summary: AccountSummary,
  instrumentName: string,
  markPrice: number,
  limitPriceLong: number,
  limitPriceShort: number,
  leverage: number,
  isMarket: boolean,
  marginTiers: MarginTier[],
  currentMaxSize: number,
  getLimitPriceFn?: (size: number, side: 'b' | 's') => number,
): number => {
  // Skip for non-perp or invalid inputs
  if (!instrumentName.includes('PERP') || currentMaxSize <= 0 || markPrice <= 0) {
    return currentMaxSize;
  }

  // Check if a given size allows at least one side to be valid
  const isValidSize = (size: number): boolean => {
    if (size <= 0) return true;

    // Recalculate limit prices for this specific size if function provided
    // This ensures we use size-specific slippage (smaller sizes = less slippage = better prices)
    const effectiveLimitPriceLong = getLimitPriceFn
      ? getLimitPriceFn(size, 'b')
      : limitPriceLong;
    const effectiveLimitPriceShort = getLimitPriceFn
      ? getLimitPriceFn(size, 's')
      : limitPriceShort;

    const { longLiquidationPrice } = getLiquidationPrice(
      summary,
      instrumentName,
      size,
      markPrice,
      effectiveLimitPriceLong,
      leverage,
      isMarket,
      marginTiers,
    );

    const { shortLiquidationPrice } = getLiquidationPrice(
      summary,
      instrumentName,
      size,
      markPrice,
      effectiveLimitPriceShort,
      leverage,
      isMarket,
      marginTiers,
    );

    const longFails = longLiquidationPrice > 0 && longLiquidationPrice >= markPrice;
    const shortFails = shortLiquidationPrice > 0 && shortLiquidationPrice <= markPrice;

    return !(longFails && shortFails);
  };

  if (isValidSize(currentMaxSize)) {
    return currentMaxSize;
  }

  let low = 0;
  let high = currentMaxSize;
  const precision = currentMaxSize * 0.0001;

  while (high - low > precision) {
    const mid = (low + high) / 2;
    if (isValidSize(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
};
