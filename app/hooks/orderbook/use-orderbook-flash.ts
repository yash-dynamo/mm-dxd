import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getOrderbookFlashConfig } from '@/config/orderbook';

export type OrderbookSide = 'ask' | 'bid';

export interface OrderbookFlashLevel {
  priceStr: string;
  size: number;
}

interface UseOrderbookFlashParams {
  asks: OrderbookFlashLevel[];
  bids: OrderbookFlashLevel[];
  visibleDepth: number;
  resetKey: string;
}

interface UseOrderbookFlashResult {
  isFlashing: (side: OrderbookSide, priceStr: string) => boolean;
  thresholdPercentage: number;
  flashDuration: number;
}

const getLevelKey = (side: OrderbookSide, priceStr: string): string => `${side}:${priceStr}`;

// Helper to create a fingerprint of orderbook levels for value comparison
const createLevelsFingerprint = (levels: OrderbookFlashLevel[]): string => {
  if (!levels || levels.length === 0) return '';
  return levels.map((l) => `${l.priceStr}:${l.size}`).join('|');
};

export const useOrderbookFlash = ({
  asks,
  bids,
  visibleDepth,
  resetKey,
}: UseOrderbookFlashParams): UseOrderbookFlashResult => {
  const config = useMemo(() => getOrderbookFlashConfig(), []);

  const initializedRef = useRef(false);
  const previousSizesRef = useRef<Map<string, number>>(new Map());
  const timeoutRef = useRef<Map<string, number>>(new Map());
  const [flashingKeys, setFlashingKeys] = useState<Set<string>>(() => new Set());

  // Use a ref to store the flash duration to avoid recreating callbacks
  const flashDurationRef = useRef(config.flashDuration);
  flashDurationRef.current = config.flashDuration;

  // Use a ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Refs for value comparison - skip processing if data hasn't actually changed
  const prevAsksFingerprint = useRef<string>('');
  const prevBidsFingerprint = useRef<string>('');
  
  // Store current asks/bids in refs so effect doesn't depend on array references
  const asksRef = useRef(asks);
  const bidsRef = useRef(bids);
  asksRef.current = asks;
  bidsRef.current = bids;

  const scheduleClear = useCallback((key: string) => {
    const existing = timeoutRef.current.get(key);

    if (existing) {
      window.clearTimeout(existing);
    }

    const timeoutId = window.setTimeout(() => {
      timeoutRef.current.delete(key);
      if (!isMountedRef.current) return;
      setFlashingKeys((prev) => {
        if (!prev.has(key)) {
          return prev;
        }

        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, flashDurationRef.current);

    timeoutRef.current.set(key, timeoutId);
  }, []);

  const triggerFlash = useCallback((key: string) => {
    setFlashingKeys((prev) => {
      if (prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(key);
      return next;
    });

    scheduleClear(key);
  }, [scheduleClear]);

  useEffect(() => {
    initializedRef.current = false;
    previousSizesRef.current = new Map();
    prevAsksFingerprint.current = '';
    prevBidsFingerprint.current = '';
    timeoutRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutRef.current.clear();
    setFlashingKeys(new Set());
  }, [resetKey]);

  useEffect(() => {
    const currentAsks = asksRef.current;
    const currentBids = bidsRef.current;
    
    // Value comparison - skip if data hasn't actually changed
    const asksFingerprint = createLevelsFingerprint(currentAsks);
    const bidsFingerprint = createLevelsFingerprint(currentBids);
    
    if (
      asksFingerprint === prevAsksFingerprint.current &&
      bidsFingerprint === prevBidsFingerprint.current
    ) {
      return; // No actual data change, skip processing
    }
    
    prevAsksFingerprint.current = asksFingerprint;
    prevBidsFingerprint.current = bidsFingerprint;

    const visibleCount =
      Number.isFinite(visibleDepth) && visibleDepth > 0 ? visibleDepth : Infinity;

    const isInitialized = initializedRef.current;
    const previousSizes = previousSizesRef.current;
    const nextSizes = new Map<string, number>();
    let sawAnyLevel = false;

    const processSide = (levels: OrderbookFlashLevel[], side: OrderbookSide) => {
      if (!Array.isArray(levels) || levels.length === 0) {
        return;
      }

      const visibleLevels = levels.slice(0, visibleCount);
      const totalVisibleSize = visibleLevels.reduce((acc, level) => acc + level.size, 0);
      const threshold = totalVisibleSize * config.thresholdPercentage;

      visibleLevels.forEach((level) => {
        const key = getLevelKey(side, level.priceStr);
        const previousSize = previousSizes.get(key) ?? 0;
        const delta = level.size - previousSize;

        if (isInitialized && delta > threshold && threshold >= 0) {
          triggerFlash(key);
        }

        nextSizes.set(key, level.size);
        sawAnyLevel = true;
      });
    };

    processSide(currentAsks, 'ask');
    processSide(currentBids, 'bid');

    previousSizesRef.current = nextSizes;
    if (sawAnyLevel && !initializedRef.current) {
      initializedRef.current = true;
    }
  }, [asks, bids, config.thresholdPercentage, triggerFlash, visibleDepth]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timeoutRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutRef.current.clear();
    };
  }, []);

  // Store flashingKeys in a ref so the callback doesn't need to be recreated
  const flashingKeysRef = useRef(flashingKeys);
  flashingKeysRef.current = flashingKeys;

  // Stable callback that reads from ref - prevents child re-renders
  const isFlashing = useCallback(
    (side: OrderbookSide, priceStr: string) => flashingKeysRef.current.has(getLevelKey(side, priceStr)),
    [], // No dependencies - reads from ref
  );

  return {
    isFlashing,
    thresholdPercentage: config.thresholdPercentage,
    flashDuration: config.flashDuration,
  };
};
