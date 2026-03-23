import { useOrderbookDataStore, useTradingDataStore } from '@/stores';
import { Orderbook } from '@/types/trading';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSubscriptionClient } from './use-subscription-client';

export function useOrderbookData() {
  const { updateOrderbook, setOrderbook, clearOrderbook } = useOrderbookDataStore();
  const { subscriptionClient } = useSubscriptionClient();
  const { selectedInstrument } = useTradingDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const orderbookSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchOrderbook = useCallback(async () => {
    if (!selectedInstrument) return;

    try {
      setIsLoading(true);
      setError(null);

      if (orderbookSubscriptionRef.current) {
        try {
          orderbookSubscriptionRef.current.unsubscribe();
        } catch (unsubscribeErr) {
          console.error('Failed to unsubscribe from previous orderbook updates:', unsubscribeErr);
        } finally {
          orderbookSubscriptionRef.current = null;
        }
      }

      try {
        const subscription = await subscriptionClient.orderbook(
          { instrumentId: selectedInstrument as string },
          (event: CustomEvent<{ books: Orderbook; update_type: 'snapshot' | 'delta' }>) => {
            if (event.detail.update_type === 'snapshot') {
              setOrderbook(event.detail.books as Orderbook);
            }
            if (event.detail.update_type === 'delta') {
              updateOrderbook(event.detail.books as Orderbook);
            }
          },
        );
        orderbookSubscriptionRef.current = subscription;
      } catch (subscriptionErr) {
        console.error('Failed to subscribe to orderbook updates:', subscriptionErr);
      }
    } catch (err) {
      console.error('Error fetching orderbook:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch orderbook'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstrument, setOrderbook, subscriptionClient, updateOrderbook]);

  useEffect(() => {
    if (selectedInstrument) {
      clearOrderbook();
      fetchOrderbook();
    }
  }, [selectedInstrument, fetchOrderbook]);

  useEffect(() => {
    return () => {
      if (orderbookSubscriptionRef.current) {
        try {
          orderbookSubscriptionRef.current.unsubscribe();
        } catch (unsubscribeErr) {
          console.error('Failed to unsubscribe from orderbook updates on cleanup:', unsubscribeErr);
        } finally {
          orderbookSubscriptionRef.current = null;
        }
      }
    };
  }, []);

  return { isLoading, error };
}
