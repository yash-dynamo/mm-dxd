import { Orderbook } from '@/types/trading';

/**
 * Calculates estimated slippage for an order by walking through the orderbook
 *
 * @param orderbook - The orderbook data with bids and asks
 * @param orderSize - Order size in base currency
 * @param side - Order side: 'b' for buy, 's' for sell
 * @param referencePrice - Reference price (mark price, best bid/ask, or limit price)
 * @returns Object with average execution price and slippage percentage, or null if insufficient liquidity
 */
export function getEstSlippage(
  orderbook: Orderbook | null | undefined,
  orderSize: number | string,
  side: 'b' | 's',
  referencePrice: number,
): { avgPrice: number; slippagePercent: number } | null {
  if (!orderbook || !orderbook.asks || !orderbook.bids) {
    return null;
  }

  const size = Number(orderSize);
  if (!Number.isFinite(size) || size <= 0) {
    return null;
  }

  if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
    return null;
  }

  // For BUY: consume asks (starting from lowest/best ask)
  // For SELL: consume bids (starting from highest/best bid)
  const levels = side === 'b' ? orderbook.asks : orderbook.bids;

  if (levels.length === 0) {
    return null;
  }

  let remainingSize = size;
  let totalCost = 0; // price * size cumulative

  for (const level of levels) {
    if (remainingSize <= 0) break;

    const levelPrice = parseFloat(level.price);
    const levelSize = parseFloat(level.size);

    if (
      !Number.isFinite(levelPrice) ||
      !Number.isFinite(levelSize) ||
      levelPrice <= 0 ||
      levelSize <= 0
    ) {
      continue;
    }

    const fillSize = Math.min(remainingSize, levelSize);
    totalCost += levelPrice * fillSize;
    remainingSize -= fillSize;
  }

  // If orderbook doesn't have enough liquidity
  if (remainingSize > 0) {
    return null;
  }

  const avgPrice = totalCost / size;

  // For buys: positive slippage means paying more than reference
  // For sells: positive slippage means receiving less than reference
  const slippagePercent =
    side === 'b'
      ? ((avgPrice - referencePrice) / referencePrice) * 100
      : ((referencePrice - avgPrice) / referencePrice) * 100;

  return { avgPrice, slippagePercent };
}
