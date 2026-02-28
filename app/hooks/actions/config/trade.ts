import { useUserTradingDataStore, useTradingDataStore } from '@/stores';
import { config } from '.';
import { waitForOrderStatus } from '../utils/wait-for-order-status';

type PlaceOrderResponse = {
  data?: {
    status?: {
      filled?: { order_id: string };
      resting?: { order_id: string };
      error?: { error: string };
    }[];
  };
};

export const tradeActions: Record<string, config> = {
  placeOrder: {
    name: 'Place Order',
    success: async ({ data, ...context } = {}) => {
      const { getOrderFromTradeHistory } = useUserTradingDataStore.getState();
      const responseData = data as PlaceOrderResponse;
      const order = responseData?.data?.status?.[0];
      const orderId = order?.filled?.order_id || order?.resting?.order_id;

      if (orderId) {
        try {
          const order = await waitForOrderStatus(orderId, getOrderFromTradeHistory);

          const instrument = useTradingDataStore
            .getState()
            .getInstrument(order?.instrument as string);
          const [base, quote] = instrument?.price_index.split('/');
          const { kind } = instrument;
          if (order) {
            const formattedInstrumentName = kind === 'spot' && order?.side === 'b' ? quote : base;
            const orderMessage = `${order.size} ${formattedInstrumentName} ${
              order.side === 'b' ? 'bought' : 'sold'
            } at average price $${order.price}`;
            return {
              title: 'Order Placed',
              description: orderMessage,
            };
          }
        } catch (error) {
        } finally {
            if (context.cloid) {
              useUserTradingDataStore.getState().deletePendingStatusOrder(context.cloid as string);
          }
        }
      }

      // For limit orders without orderId, show generic success (order is resting)
      // For market orders without orderId or fill, this is an error
      if (context.isMarket) {
        return {
          title: 'Failed to Place Order',
          description: 'Try adjusting your slippage or order size',
          error: true,
        };
      }

      return {
        title: 'Order Placed',
        description: 'Limit order placed successfully',
      };
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Place Order',
        description: error || 'Failed to place order',
      };
    },
    loading: {
      title: 'Placing Order',
    },
  },
  cancelByOrderId: {
    name: 'Cancel Order',
    success: {
      title: 'Order Cancelled',
      description: 'Order cancelled successfully',
    },
    loading: {
      title: 'Cancelling Order',
    },
  },
  editByOrderId: {
    name: 'Edit Order',
    success: {
      title: 'Order Edited',
      description: 'Order edited successfully',
    },
    loading: {
      title: 'Editing Order',
    },
  },
  cancelAll: {
    name: 'Cancel All Orders',
    success: {
      title: 'All Orders Cancelled',
      description: 'All orders cancelled',
    },
    error: ({ error } = {}) => {
      return {
        title: 'Failed to Cancel All Orders',
        description: error || 'Failed to cancel orders',
      };
    },
    loading: {
      title: 'Cancelling Orders',
    },
  },
  cancelByCloid: {
    name: 'Cancel By Cloid',
  },
  cancelByInstrument: {
    name: 'Cancel By Instrument',
  },
  cancelByInstrumentKind: {
    name: 'Cancel By Instrument Kind',
  },
};
