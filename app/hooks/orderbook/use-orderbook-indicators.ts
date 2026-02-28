import { useMemo } from 'react';

import { Instrument } from '@/types/trading';
import { useUserTradingDataStore } from '@/stores';

interface UseOrderbookIndicatorsParams {
  instrumentName: string;
  instrumentInfo?: Instrument | null;
  grouping: number;
}

interface OrderbookIndicatorResult {
  askIndicators: Set<string>;
  bidIndicators: Set<string>;
  decimals: number;
}

const EMPTY_RESULT: OrderbookIndicatorResult = {
  askIndicators: new Set<string>(),
  bidIndicators: new Set<string>(),
  decimals: 2,
};

const countDecimals = (value: number): number => {
  if (!Number.isFinite(value)) return 0;

  const asString = value.toString();

  const decimalPart = asString.split('.')[1];
  return decimalPart ? decimalPart.length : 0;
};

export const useOrderbookIndicators = ({
  instrumentName,
  instrumentInfo,
  grouping,
}: UseOrderbookIndicatorsParams): OrderbookIndicatorResult => {
  const openOrders = useUserTradingDataStore((state) => state.openOrders);

  return useMemo(() => {
    if (!instrumentInfo) {
      return EMPTY_RESULT;
    }

    const relevantOrders = Object.values(openOrders).filter(
      (order) => order.instrument === instrumentName && order.state === 'open',
    );

    if (relevantOrders.length === 0) {
      return EMPTY_RESULT;
    }

    const decimals = countDecimals(grouping);

    const bids = new Set<string>();
    const asks = new Set<string>();

    relevantOrders.forEach((order) => {
      const price = Number(order.limit_price);

      if (Number.isNaN(price)) {
        return;
      }

      const bucketPrice = grouping > 0 ? Math.floor(price / grouping) * grouping : price;
      const bucketKey = bucketPrice.toFixed(decimals);

      if (order.side === 'b') {
        bids.add(bucketKey);
      } else if (order.side === 's') {
        asks.add(bucketKey);
      }
    });

    return {
      askIndicators: asks,
      bidIndicators: bids,
      decimals,
    };
  }, [grouping, instrumentInfo, instrumentName, openOrders]);
};
