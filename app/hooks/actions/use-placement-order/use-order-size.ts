import { useState, useEffect, useRef } from 'react';
import { formatNumber } from '@/utils/formatting';
import { useTradingPreferencesStore } from '@/stores';

export type UseOrderSizeParams = {
  instrumentName: string;
  maxSize: number;
  price: number;
  isPositionClose: boolean;
  tab: 'b' | 's';
};

export function useOrderSize({
  instrumentName,
  maxSize, // choose whether this should be base or quote
  price, // just for calc
  isPositionClose,
  tab,
}: UseOrderSizeParams) {
  const defaultOrderPercentage = isPositionClose ? 100 : 0;
  const defaultOrderSize = formatNumber((maxSize * defaultOrderPercentage) / 100, {
    useTickSize: true,
    instrument_name: instrumentName ?? '',
    useGrouping: false,
    preserveDecimalString: true,
    floor: true,
  });
  const [orderSize, setOrderSize] = useState<string>(defaultOrderSize.toString());
  const orderSizeMode = useTradingPreferencesStore((state) => state.orderSizeMode);
  const previousModeRef = useRef<'quote' | 'base'>(orderSizeMode);
  const previousMaxSizeRef = useRef<number>(maxSize);

  const orderSizeNumber = Number.isFinite(Number(orderSize)) ? Number(orderSize) : 0;

  // Derive slider value from orderSize (0-100)
  // Use a small epsilon to ensure 100% is reachable when orderSize is very close to maxSize
  const orderSizeSlider =
    !Number.isFinite(maxSize) || maxSize <= 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((orderSizeNumber / maxSize) * 100)));

  useEffect(() => {
    if (!isPositionClose) {
      setOrderSize('0');
    }
    previousModeRef.current = orderSizeMode;
  }, [instrumentName]);

  useEffect(() => {
    if (!isPositionClose) {
      setOrderSize('0');
    }
  }, [tab, isPositionClose]);

  // Handle denomination change - preserve percentage instead of converting absolute value
  // This prevents precision loss from rounding when switching between quote/base
  useEffect(() => {
    const previousMode = previousModeRef.current;

    // Only convert if mode actually changed
    if (previousMode === orderSizeMode) {
      previousModeRef.current = orderSizeMode;
      previousMaxSizeRef.current = maxSize;
      if (Number(orderSize) > Number(maxSize)) {
        setOrderSize(
          formatNumber(maxSize, {
            useContractSize: true,
            instrument_name: instrumentName ?? '',
            useGrouping: false,
            floor: true,
          }),
        );
      }
      return;
    }

    // When denomination changes, calculate percentage using PREVIOUS maxSize (before recalculation)
    // Then apply that percentage to the NEW maxSize (after recalculation)
    // This preserves the percentage relationship and prevents precision loss from direct conversion
    if (previousMode !== orderSizeMode && orderSizeNumber > 0 && previousMaxSizeRef.current > 0) {
      // Calculate percentage using previous maxSize to get the correct ratio
      // orderSizeNumber is still in the old denomination at this point
      const percentage = (orderSizeNumber / previousMaxSizeRef.current) * 100;

      if (percentage > 0 && maxSize > 0) {
        // Apply the same percentage to the new maxSize in the new denomination
        // This ensures slider stays at the same percentage (e.g., 100% stays 100%)
        handleOrderSizeSliderChange(percentage);
      }
    }

    previousModeRef.current = orderSizeMode;
    previousMaxSizeRef.current = maxSize;
  }, [orderSizeMode, maxSize]);

  const handleOrderSizeSliderChange = (value: number) => {
    // Slider value is 0-100, convert to actual order size
    const clampedValue = Math.min(100, Math.max(0, value));

    if (!Number.isFinite(maxSize) || maxSize <= 0) {
      setOrderSize('0');
      return;
    }

    // If slider is at 100%, use maxSize directly to avoid rounding issues
    if (clampedValue >= 99.9) {
      const maxSizeFormatted = formatNumber(maxSize, {
        useContractSize: true,
        instrument_name: instrumentName ?? '',
        useGrouping: false,
        floor: true,
      });
      setOrderSize(maxSizeFormatted);

      return;
    }

    // Convert slider percentage to order size
    const nextOrderSizeRaw = (clampedValue / 100) * maxSize;

    // Snap to lot size grid
    const nextOrderSize = formatNumber(nextOrderSizeRaw, {
      useContractSize: true,
      instrument_name: instrumentName ?? '',
      useGrouping: false,
      floor: true,
    });

    setOrderSize(nextOrderSize);
  };

  const handleOrderSizeChange = (value: string) => {
    const isValidInput = value === '' || value === '.' || /^-?\d*\.?\d*$/.test(value);

    if (!isValidInput) return;

    if (value === '' || value === '.') {
      setOrderSize(value);
      return;
    }

    const endsWithPeriod = value.endsWith('.');

    if (!endsWithPeriod && !isNaN(Number(value)) && value.trim() !== '') {
      setOrderSize(value);
    } else {
      setOrderSize(value);
    }
  };

  // if maxSize updated but orderSize is greater than maxSize, set orderSize to maxSize
  // useEffect(() => {
  //   if (Number(orderSize) > Number(maxSize)) {
  //     setOrderSize(formatNumber(maxSize, {
  //       useContractSize: true,
  //       instrument_name: instrumentName ?? '',
  //       useGrouping: false,
  //       floor: true,
  //     }));
  //   }
  // }, [maxSize]);
  return {
    orderSize,
    handleOrderSizeChange,
    orderSizeSlider,
    handleOrderSizeSliderChange,
  };
}
