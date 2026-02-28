import { useEffect, useState, useCallback, useRef } from 'react';
import { useInfoClient } from './use-info-client';
import { useSubscriptionClient } from './use-subscription-client';
import { useTradingDataStore } from '@/stores';
import { Instrument, OracleFeed, SupportedCollateral, Ticker, Trade } from '@/types/trading';
import { useParams } from 'next/navigation';

export function useTradingData() {
  const {
    updateInstruments,
    updateTicker,
    selectedInstrument,
    setTrades,
    updateTrades,
    clearTrades,
    updateOracleFeed,
    setSupportedCollateral,
  } = useTradingDataStore();
  const { infoClient } = useInfoClient();
  const { subscriptionClient } = useSubscriptionClient();
  const pathname = useParams();
  const pathnameRef = useRef(pathname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const tradeSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const tickerSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const getInstruments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Start both requests in parallel
      const instrumentsPromise = infoClient.getInstruments({
        type: 'all',
      });

      const tickerPromise = infoClient.getTicker({
        symbol: 'all',
      }) as Promise<Ticker[]>;

      // Handle ticker response as soon as it arrives
      tickerPromise
        .then((response) => {
          for (const ticker of response) {
            updateTicker(ticker.symbol, ticker);
          }
        })
        .catch((err) => {
          console.error('Failed to get ticker for all instruments', err);
        });

      // Handle instruments response
      const instruments = await instrumentsPromise;

      if (instruments && typeof instruments === 'object') {
        updateInstruments(instruments as Record<string, Instrument[]>);
        try {
          const subscription = await subscriptionClient.ticker(
            { symbol: 'all' },
            (event: CustomEvent<Ticker>) => {
              const ticker = event.detail;
              updateTicker(ticker.instrument_name, ticker);
            },
          );
          tickerSubscriptionRef.current = subscription;
        } catch (err) {
          console.error('Failed to subscribe to ticker for all instruments', err);
        }
      }

      return instruments;
    } catch (err) {
      console.error('Error fetching instruments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch instruments'));
      // throw err;
    } finally {
      setIsLoading(false);
    }
  }, [infoClient, subscriptionClient, updateInstruments, updateTicker]);

  const fetchTrades = useCallback(
    async (instrumentName: string) => {
      try {
        // Unsubscribe from previous trade subscription if it exists
        if (tradeSubscriptionRef.current) {
          tradeSubscriptionRef.current.unsubscribe();
          tradeSubscriptionRef.current = null;
        }

        // Clear existing trades when switching instruments
        clearTrades();

        const trades = await infoClient.getTrades({
          symbol: instrumentName,
          limit: 20,
        });

        setTrades(trades as Trade[]);

        try {
          const subscription = await subscriptionClient.trade(
            { instrumentId: instrumentName },
            (event: CustomEvent<Trade>) => {
              const updatedTrades = event.detail;
              updateTrades(updatedTrades);
            },
          );

          // Store the subscription reference for cleanup
          tradeSubscriptionRef.current = subscription;
        } catch (subscriptionErr) {
          console.error('Failed to subscribe to trade updates:', subscriptionErr);
        }
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch trades'));
        // throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [infoClient, setTrades, updateTrades, subscriptionClient, clearTrades],
  );

  useEffect(() => {
    getInstruments();
  }, [getInstruments]);

  useEffect(() => {
    if (selectedInstrument) {
      fetchTrades(selectedInstrument as string);
    }
  }, [selectedInstrument, fetchTrades]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (tradeSubscriptionRef.current) {
        tradeSubscriptionRef.current.unsubscribe();
        tradeSubscriptionRef.current = null;
      }
      if (tickerSubscriptionRef.current) {
        tickerSubscriptionRef.current.unsubscribe();
        tickerSubscriptionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchOracleFeed = async () => {
      try {
        const oracleFeed = await infoClient.getOracleFeed({
          symbol: 'USDT/USDC',
        });
        updateOracleFeed(oracleFeed as OracleFeed);
      } catch (err) {
        console.error('Error fetching oracle feed:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch oracle feed'));
        // throw err;
      }
    };
    fetchOracleFeed();
  }, [infoClient, updateOracleFeed]);

  useEffect(() => {
    const fetchSupportedCollaterals = async () => {
      try {
        const supportedCollaterals = await infoClient.getSupportedCollateral({});
        setSupportedCollateral(supportedCollaterals as SupportedCollateral[]);
      } catch (err) {
        console.error('Error fetching supported collaterals:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch supported collaterals'));
        // throw err;
      }
    };
    fetchSupportedCollaterals();
  }, [infoClient, setSupportedCollateral]);

  return {
    getInstruments,
    isLoading,
    error,
  };
}

export function useThrottledTrades(throttleMs: number = 100) {
  // Use Zustand selector to properly subscribe to trades changes
  const rawTrades = useTradingDataStore((state) => state.trades);
  const selectedInstrument = useTradingDataStore((state) => state.selectedInstrument);
  const [throttledTrades, setThrottledTrades] = useState<Trade[] | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<boolean>(false);
  const lastTradesRef = useRef<Trade[] | undefined>(undefined);

  const updateThrottledData = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const currentTrades = rawTrades;

    // Skip update if data hasn't changed (reference equality check)
    if (currentTrades === lastTradesRef.current) {
      return;
    }

    if (timeSinceLastUpdate >= throttleMs) {
      // Update immediately if enough time has passed
      setThrottledTrades(currentTrades);
      lastTradesRef.current = currentTrades;
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
        setThrottledTrades(rawTrades);
        lastTradesRef.current = rawTrades;
        lastUpdateRef.current = Date.now();
        pendingUpdateRef.current = false;
      }, remainingTime);
    }
  };

  useEffect(() => {
    if (!selectedInstrument) return;

    // Initialize with current data
    setThrottledTrades(rawTrades);
    lastTradesRef.current = rawTrades;
    lastUpdateRef.current = Date.now();
  }, [selectedInstrument, rawTrades]);

  // Trigger throttled updates when raw data changes
  useEffect(() => {
    updateThrottledData();
  }, [rawTrades]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledTrades;
}
