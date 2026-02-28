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
    if (!selectedInstrument) {
      return;
    }

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
          (
            event: CustomEvent<{
              books: Orderbook;
              update_type: 'snapshot' | 'delta';
            }>,
          ) => {
            if (event.detail.update_type === 'snapshot') {
              const updatedOrderbook = event.detail.books;
              setOrderbook(updatedOrderbook as Orderbook);

              // Verify it was set
              const stored = useOrderbookDataStore.getState().orderbook;
            }
            if (event.detail.update_type === 'delta') {
              const updatedOrderbook = event.detail.books;
              updateOrderbook(updatedOrderbook as Orderbook);

              // Verify it was updated
              const stored = useOrderbookDataStore.getState().orderbook;
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

  return {
    isLoading,
    error,
  };
}

export function useThrottledOrderbook(throttleMs: number = 100) {
  const selectedInstrument = useTradingDataStore((state) => state.selectedInstrument);

  // Subscribe to orderbook changes
  const rawOrderbook = useOrderbookDataStore((state) => state.orderbook);

  const [throttledOrderbook, setThrottledOrderbook] = useState<Orderbook | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<boolean>(false);
  const lastOrderbookRef = useRef<Orderbook | undefined>(undefined);
  
  // Store rawOrderbook in ref to avoid callback recreation
  const rawOrderbookRef = useRef<Orderbook | undefined>(rawOrderbook);
  rawOrderbookRef.current = rawOrderbook;

  // Stable callback that reads from ref - no dependencies on rawOrderbook
  const updateThrottledData = useCallback(() => {
    const currentOrderbook = rawOrderbookRef.current;

    if (!currentOrderbook) {
      setThrottledOrderbook((prev) => (prev !== undefined ? undefined : prev));
      lastOrderbookRef.current = undefined;
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Skip update if data hasn't changed (reference equality check)
    if (currentOrderbook === lastOrderbookRef.current) {
      return;
    }

    if (timeSinceLastUpdate >= throttleMs) {
      // Update immediately if enough time has passed
      setThrottledOrderbook(currentOrderbook);
      lastOrderbookRef.current = currentOrderbook;
      lastUpdateRef.current = now;
      pendingUpdateRef.current = false;
    } else if (!pendingUpdateRef.current) {
      // Schedule update for later
      pendingUpdateRef.current = true;
      const remainingTime = throttleMs - timeSinceLastUpdate;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        // Use the ref to get the latest orderbook at timeout execution
        const latestOrderbook = rawOrderbookRef.current;
        if (latestOrderbook) {
          setThrottledOrderbook(latestOrderbook);
          lastOrderbookRef.current = latestOrderbook;
        }
        lastUpdateRef.current = Date.now();
        pendingUpdateRef.current = false;
      }, remainingTime);
    }
  }, [throttleMs]);

  // Reset on instrument change
  useEffect(() => {
    if (!selectedInstrument) {
      setThrottledOrderbook(undefined);
      lastOrderbookRef.current = undefined;
      lastUpdateRef.current = 0;
      return;
    }
  }, [selectedInstrument]);

  // Trigger throttled updates when raw data changes
  useEffect(() => {
    updateThrottledData();
  }, [rawOrderbook, updateThrottledData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledOrderbook;
}
