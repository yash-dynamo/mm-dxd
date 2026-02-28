import { useCallback, useEffect, useState } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useTradingDataStore, useUserTradingDataStore } from '@/stores';

type LeverageResponse = {
  leverage?: number;
  Leverage?: number;
  margin_type?: string;
  MarginType?: string;
};

export function useInstrumentLeverage() {
  const { setLeverage } = useUserTradingDataStore();
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const instruments = useTradingDataStore((state) => state.instruments);
  const perpCount = Object.values(instruments).filter((i) => i.kind === 'perps').length;

  const fetchInstrumentLeverage = useCallback(
    async (symbol?: string) => {
      if (!address || status === 'disconnected') return;
      try {
        setLoading(true);
        setError(null);

        if (symbol) {
          if (!symbol.includes('PERP')) return;
          const res = (await infoClient.getInstrumentLeverage({
            user: address,
            symbol,
          })) as LeverageResponse;
          setLeverage(symbol, {
            leverage: res?.leverage ?? res?.Leverage ?? 1,
            margin_mode: res?.margin_type ?? res?.MarginType ?? 'cross',
          });
          return;
        }

        const perpNames = Object.values(useTradingDataStore.getState().instruments)
          .filter((i) => i.kind === 'perps')
          .map((i) => i.name);
        if (perpNames.length === 0) return;

        const results = await Promise.allSettled(
          perpNames.map((name) =>
            infoClient.getInstrumentLeverage({ user: address, symbol: name }),
          ),
        );
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && perpNames[index]) {
            const res = result.value as LeverageResponse;
            setLeverage(perpNames[index], {
              leverage: res?.leverage ?? res?.Leverage ?? 1,
              margin_mode: res?.margin_type ?? res?.MarginType ?? 'cross',
            });
          }
        });
      } catch (err) {
        console.error('Error fetching instrument leverage:', err);
        setError('Failed to fetch instrument leverage');
      } finally {
        setLoading(false);
      }
    },
    [address, status, infoClient, setLeverage],
  );

  useEffect(() => {
    if (address && status !== 'disconnected' && perpCount > 0) {
      fetchInstrumentLeverage();
    }
  }, [address, status, perpCount, fetchInstrumentLeverage]);

  return {
    isLoading,
    error,
    fetchInstrumentLeverage,
  };
}
