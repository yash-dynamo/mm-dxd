'use client';

import { FC, ReactNode, useEffect, useRef, useMemo } from 'react';
import { useTradingData } from '@/hooks/info/use-trading-data';
import { useOrderbookData } from '@/hooks/info/use-orderbook';
import { useTradingDataStore } from '@/stores';
import { useParams, usePathname } from 'next/navigation';
import { useCanAccessPlatform } from '@/utils/access';
import { getInstrumentFromParams } from '@/stores/utils';
import Loader from '@/components/ui/loader';
import { useRouter } from 'next/navigation';

interface TradingDataProviderProps {
  children: ReactNode;
}

// Wrapper that skips TradingDataProvider when user cannot access platform
export const TradingDataProvider: FC<TradingDataProviderProps> = ({ children }) => {
  const { canAccess, isLoading: isAccessLoading } = useCanAccessPlatform();
  const pathname = usePathname();
  const isJoinWaitlist = pathname === '/join-waitlist';
  
  // Skip trading data provider if still loading access, can't access, or on join-waitlist
  if (isAccessLoading || !canAccess || isJoinWaitlist) {
    return <>{children}</>;
  }
  

  return <TradingDataProviderInner>{children}</TradingDataProviderInner>;
};

const TradingDataProviderInner: FC<TradingDataProviderProps> = ({ children }) => {
  const { isLoading, error } = useTradingData();
  const {} = useOrderbookData();

  const { instruments, tickers, setSelectedInstrument, selectedInstrument } = useTradingDataStore();

  const pathname = usePathname();
  const { instrument } = useParams<{ instrument: string }>();
  const router = useRouter();
  const instrumentName = getInstrumentFromParams(instrument);

  const prevPathName = useRef<string | null>(null);

  const kind = instrumentName ? (instruments[instrumentName]?.kind ?? 'perps') : 'perps';
  // Check if we need to wait for ticker data
  const needsTickerData = useMemo(() => {
    if (!instruments || isLoading || selectedInstrument) return false;

    const instrumentsList = Object.values(instruments);
    if (instrumentsList.length === 0) return false;

    if (instrumentName) return false; // If instrument is specified, we don't need ticker data

    const defaultInstrumentKind = kind;
    const filteredInstruments = instrumentsList.filter(
      (instrument) => instrument.kind === defaultInstrumentKind,
    );

    // Check if ALL filtered instruments have mark_price or index_price
    const allHavePriceData = filteredInstruments.every((instrument) => {
      const ticker = tickers[instrument.name];
      return ticker && (ticker.mark_price || ticker.index_price);
    });

    // Wait if not all filtered instruments have price data yet
    // This ensures we wait for all ticker data before selecting default instrument by volume
    return !allHavePriceData;
  }, [instruments, tickers, isLoading, selectedInstrument, pathname, instrumentName]);

  useEffect(() => {
    const previousPath = prevPathName.current;

    // Update the ref after using the previous value
    prevPathName.current = pathname;

    if (!instruments) return;
    if (previousPath === pathname && selectedInstrument) return;

    const instrumentsList = Object.values(instruments);

    if (instrumentsList.length === 0) return;

    if (instrumentName) {
      const instrument = instrumentsList.find((instrument) => instrument.name === instrumentName);
      if (!instrument) {
        router.push('/trade');
        return;
      }
      setSelectedInstrument(instrument?.name || '');
    } else {
      const defaultInstrumentKind = 'perps';
      // Filter by kind
      const filteredInstruments = instrumentsList.filter(
        (instrument) => instrument.kind === defaultInstrumentKind,
      );

      // Check if ALL filtered instruments have mark_price or index_price
      const allHavePriceData = filteredInstruments.every((instrument) => {
        const ticker = tickers[instrument.name];
        return ticker && (ticker.mark_price || ticker.index_price);
      });

      // Wait for all ticker data before sorting and selecting
      if (!allHavePriceData) {
        // Not all filtered instruments have price data yet, wait for them
        return;
      }

      // Sort by volume24h (highest first)
      const sortedInstruments = [...filteredInstruments].sort((a, b) => {
        const tickerA = tickers[a.name];
        const tickerB = tickers[b.name];
        const volumeA = tickerA?.volume_24h ?? 0;
        const volumeB = tickerB?.volume_24h ?? 0;
        return volumeB - volumeA; // Descending order
      });

      // Select first instrument (highest volume) or fallback to first available
      const defaultInstrument =
        sortedInstruments[0] || filteredInstruments[0] || instrumentsList[0];
      setSelectedInstrument(
        selectedInstrument ? selectedInstrument : defaultInstrument?.name || '',
      );
    }
  }, [instruments, tickers, setSelectedInstrument, pathname, instrumentName, selectedInstrument]);

  if (error) {
    throw error;
  }

  if (isLoading || !selectedInstrument || needsTickerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
};
