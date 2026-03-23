import { StateCreator } from 'zustand';
import { Order, OrderHistory, TradeHistory } from '@/types/trading';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrdersState {
  openOrders: Record<string, Order>;
  orderHistory: Record<string, OrderHistory>;
  tradeHistory: Record<string, TradeHistory>;
  /** Client order IDs awaiting a status update from the exchange */
  pendingStatusOrders: string[];
}

export interface OrdersActions {
  // Open Orders
  setOpenOrders: (openOrders: Order[]) => void;
  updateOpenOrders: (order: Order) => void;
  clearOpenOrders: () => void;
  /** Returns only TP/SL orders from open orders */
  getTPSLOrders: () => Order[];

  // Order History
  setOrderHistory: (orderHistory: OrderHistory[]) => void;
  updateOrderHistory: (orderHistory: OrderHistory) => void;
  clearOrderHistory: () => void;

  // Trade History
  setTradeHistory: (tradeHistory: TradeHistory[]) => void;
  updateTradeHistory: (tradeHistory: TradeHistory) => void;
  clearTradeHistory: () => void;
  /** Find the trade entry that belongs to a given order ID */
  getOrderFromTradeHistory: (orderId: string) => TradeHistory | undefined;

  // Pending Status Orders
  updatePendingStatusOrders: (cloid: string | string[]) => void;
  deletePendingStatusOrder: (cloid: string) => void;
  clearPendingStatusOrders: () => void;
}

export type OrdersSlice = OrdersState & OrdersActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: OrdersState = {
  openOrders: {},
  orderHistory: {},
  tradeHistory: {},
  pendingStatusOrders: [],
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createOrdersSlice: StateCreator<OrdersSlice> = (set, get) => ({
  ...initialState,

  // Open Orders
  setOpenOrders: (openOrders) => {
    const record = openOrders.reduce(
      (acc, order) => {
        acc[order.order_id] = order;
        return acc;
      },
      {} as Record<string, Order>,
    );
    set({ openOrders: record });
  },

  updateOpenOrders: (order) => {
    const current = { ...get().openOrders };

    if (order.state === 'cancelled' || order.state === 'filled' || order.state === 'triggered') {
      delete current[order.order_id];
      // Move non-triggered terminal orders into history
      if (order.state !== 'triggered') {
        set({ orderHistory: { ...get().orderHistory, [order.order_id]: order } });
      }
    } else {
      current[order.order_id] = {
        ...order,
        trigger_px: order.trigger_px || order.trigger_price || '',
      };
    }

    set({ openOrders: current });
  },

  clearOpenOrders: () => set({ openOrders: {} }),

  getTPSLOrders: () => Object.values(get().openOrders).filter((order) => order.tpsl !== ''),

  // Order History
  setOrderHistory: (orderHistory) => {
    const record = orderHistory.reduce(
      (acc, order) => {
        acc[order.order_id] = order;
        return acc;
      },
      {} as Record<string, OrderHistory>,
    );
    set({ orderHistory: record });
  },

  updateOrderHistory: (orderHistory) => {
    set({ orderHistory: { ...get().orderHistory, [orderHistory.order_id]: orderHistory } });
  },

  clearOrderHistory: () => set({ orderHistory: {} }),

  // Trade History
  setTradeHistory: (tradeHistory) => {
    const record = tradeHistory.reverse().reduce(
      (acc, trade) => {
        acc[trade.trade_id] = trade;
        return acc;
      },
      {} as Record<string, TradeHistory>,
    );
    set({ tradeHistory: record });
  },

  updateTradeHistory: (tradeHistory) => {
    // Prepend so the newest trade appears first
    set({ tradeHistory: { [tradeHistory.trade_id]: tradeHistory, ...get().tradeHistory } });
  },

  clearTradeHistory: () => set({ tradeHistory: {} }),

  getOrderFromTradeHistory: (orderId) =>
    Object.values(get().tradeHistory).find((trade) => trade.order_id.toString() === orderId),

  // Pending Status Orders
  updatePendingStatusOrders: (cloid) => {
    const additions = Array.isArray(cloid) ? cloid : [cloid];
    set({ pendingStatusOrders: [...get().pendingStatusOrders, ...additions] });
  },

  deletePendingStatusOrder: (orderId) => {
    set({ pendingStatusOrders: get().pendingStatusOrders.filter((id) => id !== orderId) });
  },

  clearPendingStatusOrders: () => set({ pendingStatusOrders: [] }),
});
