import { StateCreator } from 'zustand';
import { Orderbook, BookLevel } from '@/types/trading';

export interface OrderbookDataState {
  orderbook: Orderbook;
}

export interface OrderbookDataActions {
  setOrderbook: (orderbook: Orderbook) => void;
  updateOrderbook: (orderbook: Orderbook) => void;
  clearOrderbook: () => void;
  getGroupedOrderbook: (groupingSize: number) => Orderbook | undefined;
}

export type OrderbookDataStoreState = OrderbookDataState & OrderbookDataActions;

function mergeLevels(
  existingLevels: BookLevel[],
  deltaLevels: BookLevel[],
  isAsk: boolean,
): BookLevel[] {
  const levelMap = new Map<string, BookLevel>();

  existingLevels.forEach((level) => {
    levelMap.set(level.price, level);
  });

  deltaLevels.forEach((level) => {
    if (parseFloat(level.size) === 0) {
      levelMap.delete(level.price);
    } else {
      levelMap.set(level.price, level);
    }
  });

  const result = Array.from(levelMap.values());

  result.sort((a, b) => {
    const priceA = parseFloat(a.price);
    const priceB = parseFloat(b.price);
    return isAsk ? priceA - priceB : priceB - priceA;
  });

  return result;
}

function groupLevels(levels: BookLevel[], groupingSize: number): BookLevel[] {
  if (groupingSize <= 0) return levels;

  const groupedMap = new Map<string, { price: number; size: number }>();

  levels.forEach((level) => {
    const price = parseFloat(level.price);
    const size = parseFloat(level.size);

    const groupedPrice = Math.floor(price / groupingSize) * groupingSize;
    const groupedPriceStr = groupedPrice.toString();

    if (groupedMap.has(groupedPriceStr)) {
      const existing = groupedMap.get(groupedPriceStr)!;
      existing.size += size;
    } else {
      groupedMap.set(groupedPriceStr, { price: groupedPrice, size });
    }
  });

  return Array.from(groupedMap.entries())
    .map(([priceStr, data]) => ({
      price: priceStr,
      size: data.size.toString(),
    }))
    .sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return priceA - priceB;
    });
}

export const createOrderbookDataSlice: StateCreator<OrderbookDataStoreState> = (set, get) => ({
  orderbook: {
    bids: [],
    asks: [],
    instrument_name: '',
    timestamp: 0,
    sequence_number: 0,
  },

  setOrderbook: (orderbook: Orderbook) => {
    set({ orderbook });
  },

  updateOrderbook: (deltaOrderbook: Orderbook) => {
    const updatedBids = mergeLevels(get().orderbook.bids, deltaOrderbook.bids, false);
    const updatedAsks = mergeLevels(get().orderbook.asks, deltaOrderbook.asks, true);

    const updatedOrderbook: Orderbook = {
      bids: updatedBids,
      asks: updatedAsks,
      instrument_name: deltaOrderbook.instrument_name || get().orderbook.instrument_name,
      timestamp: deltaOrderbook.timestamp || get().orderbook.timestamp,
      sequence_number: deltaOrderbook.sequence_number || get().orderbook.sequence_number,
    };

    set({
      orderbook: updatedOrderbook,
    });
  },

  clearOrderbook: () => {
    set({
      orderbook: {
        bids: [],
        asks: [],
        instrument_name: '',
        timestamp: 0,
        sequence_number: 0,
      },
    });
  },

  getGroupedOrderbook: (groupingSize: number) => {
    const orderbook = get().orderbook;
    if (groupingSize <= 0) return orderbook;

    const groupedBids = groupLevels(orderbook.bids, groupingSize);
    const groupedAsks = groupLevels(orderbook.asks, groupingSize);

    return {
      ...orderbook,
      bids: groupedBids,
      asks: groupedAsks,
    };
  },
});
