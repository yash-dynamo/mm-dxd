import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber } from '@/utils/formatting';
import { getValidPrice } from '@/utils/global';
import { Ticker } from '@/types/trading';
import { useTradingDataStore, useTradingPreferencesStore } from '@/stores';

type UseLimitPriceParams = {
  instrumentName: string;
  ticker?: Ticker;
  localLimitState?: boolean;
};

export function useLimitPrice({ instrumentName, ticker, localLimitState }: UseLimitPriceParams) {
  const getDefaultPrice = (tickerData?: Ticker): string => {
    if (!tickerData) return '0';
    return (
      getValidPrice(tickerData.mid_price) ??
      getValidPrice(tickerData.mark_price) ??
      getValidPrice(tickerData.index_price) ??
      '0'
    );
  };

  const { orderTypePersist } = useTradingPreferencesStore();

  const defaultPrice = getDefaultPrice(ticker);
  const [localLimitPrice, setLocalLimitPrice] = useState(defaultPrice);
  const { limitPrice: globalLimitPrice, setLimitPrice: setGlobalLimitPrice } =
    useTradingDataStore();
  const latestTickerRef = useRef<Ticker | undefined>(ticker);
  const pendingInitRef = useRef<boolean>(false);

  const limitPrice = localLimitState ? localLimitPrice : globalLimitPrice;
  const setLimitPrice = localLimitState ? setLocalLimitPrice : setGlobalLimitPrice;

  useEffect(() => {
    latestTickerRef.current = ticker;
  }, [ticker]);

  const handleLimitPriceChange = useCallback(
    (value: string) => {
      value = value.replaceAll(',', '');
      const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);

      if (isValidInput) {
        if (value === '' || value === '.') {
          setLimitPrice(value);
          return;
        }

        const endsWithPeriod = value.endsWith('.');

        if (!endsWithPeriod && !isNaN(Number(value)) && value.trim() !== '') {
          // const normalizedValue = formatNumber(value, {
          //   useTickSize: true,
          //   instrument_name: instrumentName,
          //   useGrouping: false,
          // });
          const normalizedValue = value;
          setLimitPrice(normalizedValue);
        } else {
          setLimitPrice(value);
        }
      }
    },
    [setLimitPrice],
  );

  const handleGetMidPrice = useCallback(() => {
    if (!ticker) return;
    const price =
      getValidPrice(ticker.mid_price) ??
      getValidPrice(ticker.mark_price) ??
      getValidPrice(ticker.index_price) ??
      '0';
    const formattedPrice = formatNumber(price, {
      useTickSize: true,
      instrument_name: instrumentName,
      useGrouping: false,
    });

    handleLimitPriceChange(formattedPrice);
  }, [ticker, handleLimitPriceChange, instrumentName]);

  useEffect(() => {
    if (!instrumentName) return;

    const currentTicker = latestTickerRef.current;
    pendingInitRef.current = true;

    if (currentTicker) {
      const price =
        getValidPrice(currentTicker.mid_price) ??
        getValidPrice(currentTicker.mark_price) ??
        getValidPrice(currentTicker.index_price);
      if (price) {
        const formattedPrice = formatNumber(price, {
          useTickSize: true,
          instrument_name: instrumentName,
          useGrouping: false,
        });
        setLimitPrice(formattedPrice);
      }
      pendingInitRef.current = false;
    }
  }, [instrumentName, setLimitPrice]);

  // Handle ticker data becoming available after instrument change
  useEffect(() => {
    if (!pendingInitRef.current) return;
    const currentTicker = latestTickerRef.current;
    if (!currentTicker) return;

    const price =
      getValidPrice(currentTicker.mid_price) ??
      getValidPrice(currentTicker.mark_price) ??
      getValidPrice(currentTicker.index_price);
    if (price) {
      const formattedPrice = formatNumber(price, {
        useTickSize: true,
        instrument_name: instrumentName,
        useGrouping: false,
      });
      setLimitPrice(formattedPrice);
    }
    pendingInitRef.current = false;
  }, [ticker, instrumentName, setLimitPrice]);

  // Derive limit price validation error from current state
  const error = useMemo(() => {
    // Only validate for limit orders
    if (orderTypePersist !== 'limit') {
      return null;
    }

    // Skip validation for empty/incomplete inputs
    const priceValue = limitPrice ? String(limitPrice).replaceAll(',', '') : '';
    if (!priceValue || priceValue === '.' || isNaN(Number(priceValue))) {
      return null;
    }

    const basePrice = Number(ticker?.mark_price ?? ticker?.index_price ?? 0);
    if (basePrice <= 0) {
      return null;
    }


    return null;
  }, [orderTypePersist, limitPrice, ticker, instrumentName]);

  return {
    limitPrice,
    error,
    setLimitPrice,
    handleLimitPriceChange,
    handleGetMidPrice,
  } as const;
}
