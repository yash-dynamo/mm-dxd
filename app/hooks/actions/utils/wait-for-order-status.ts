import { TradeHistory } from '@/types/trading';

export const waitForOrderStatus = async (
  orderId: string,
  getOrderFromTradeHistory: (orderId: string) => TradeHistory | undefined,
  timeout: number = 1000,
): Promise<TradeHistory | undefined> => {
  return new Promise((resolve, reject) => {
    const pollForOrderStatus = setInterval(() => {
      const order = getOrderFromTradeHistory(orderId.toString());
      if (order) {
        clearInterval(pollForOrderStatus);
        resolve(order);
      }
    }, 50);
    setTimeout(() => {
      clearInterval(pollForOrderStatus);
      reject(undefined);
    }, timeout);
  });
};
