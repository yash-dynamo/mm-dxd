'use client';

import { useEffect, useState, useRef } from 'react';
import { useInfoClient } from './info/use-info-client';
import { useSubscriptionClient } from './info/use-subscription-client';

interface LandingTicker {
  symbol: string;
  instrument_name: string;
  mark_price: string;
  index_price: string;
  change_24h?: number;
}

export function useLandingTickers() {
  const [tickers, setTickers] = useState<Record<string, LandingTicker>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { infoClient } = useInfoClient();
  const { subscriptionClient } = useSubscriptionClient();
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTickers = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all tickers
        const response = await infoClient.ticker({
          symbol: 'all',
        });

        if (cancelled) return;

        // Process tickers into a map
        const tickerMap: Record<string, LandingTicker> = {};
        if (Array.isArray(response)) {
          for (const ticker of response) {
            const t = ticker as unknown as {
              instrument_name?: string;
              symbol?: string;
              mark_price?: string;
              index_price?: string;
              change_24h?: number | string;
            };
            const name = t.instrument_name || t.symbol;
            if (name && name.includes('-PERP')) {
              const ch = t.change_24h;
              tickerMap[name] = {
                symbol: t.symbol ?? name,
                instrument_name: name,
                mark_price: t.mark_price || t.index_price || '0',
                index_price: t.index_price || '0',
                change_24h: typeof ch === 'string' ? parseFloat(ch) : ch,
              };
            }
          }
        }

        setTickers(tickerMap);

        // Subscribe to live updates
        try {
          const subscription = await subscriptionClient.ticker(
            { symbol: 'all' },
            (event: CustomEvent<LandingTicker>) => {
              const ticker = event.detail;
              const name = ticker.instrument_name || ticker.symbol;
              if (name && name.includes('-PERP')) {
                setTickers((prev) => ({
                  ...prev,
                  [name]: {
                    symbol: ticker.symbol,
                    instrument_name: name,
                    mark_price: ticker.mark_price || ticker.index_price || '0',
                    index_price: ticker.index_price || '0',
                    change_24h: ticker.change_24h,
                  },
                }));
              }
            },
          );
          subscriptionRef.current = subscription;
        } catch (err) {
          console.error('Failed to subscribe to ticker updates:', err);
        }
      } catch (err) {
        console.error('Failed to fetch tickers:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchTickers();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [infoClient, subscriptionClient]);

  return { tickers, isLoading };
}
