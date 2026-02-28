'use client';

import { useEffect, useRef, useState } from 'react';

// Local mock types based on the provided contract
interface TickerStats {
  change_24h: string; // absolute change over 24h (same units as price)
  volume_24h: string; // base units
}

export interface Ticker {
  best_ask_amount: string;
  best_ask_price: string;
  best_bid_amount: string;
  best_bid_price: string;
  funding_rate: string;
  index_price: string;
  instrument_name: string;
  last_price: string;
  mark_price: string;
  max_price: string;
  min_price: string;
  open_interest: string;
  stats: TickerStats;
  timestamp: string;
  delta?: string;
  best_bid_iv?: string;
  best_bid_size?: string;
  sigma?: string;
  best_ask_iv?: string;
  best_ask_size?: string;
}

function toFixedString(value: number, decimals = 4): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : '0';
}

function nowIso(): string {
  return new Date().toISOString();
}

function createInitialMockTicker(instrumentName: string): Ticker {
  const base = 50000; // starting reference price
  const last = base * (1 + (Math.random() - 0.5) * 0.02);
  const bid = last * (1 - 0.0005);
  const ask = last * (1 + 0.0005);
  return {
    best_ask_amount: toFixedString(1 + Math.random() * 5, 3),
    best_ask_price: toFixedString(ask, 2),
    best_bid_amount: toFixedString(1 + Math.random() * 5, 3),
    best_bid_price: toFixedString(bid, 2),
    funding_rate: toFixedString((Math.random() - 0.5) * 0.002, 6), // decimal (e.g., 0.0005 => 0.05%)
    index_price: toFixedString(last * (1 + (Math.random() - 0.5) * 0.001), 2),
    instrument_name: instrumentName,
    last_price: toFixedString(last, 2),
    mark_price: toFixedString(last * (1 + (Math.random() - 0.5) * 0.0008), 2),
    max_price: toFixedString(last * 1.01, 2),
    min_price: toFixedString(last * 0.99, 2),
    open_interest: toFixedString(10000000 + Math.random() * 2000000, 2),
    stats: {
      change_24h: toFixedString((Math.random() - 0.5) * (base * 0.03), 2),
      volume_24h: toFixedString(1000 + Math.random() * 5000, 2),
    },
    timestamp: nowIso(),
    delta: undefined,
    best_bid_iv: undefined,
    best_bid_size: undefined,
    sigma: undefined,
    best_ask_iv: undefined,
    best_ask_size: undefined,
  };
}

function stepTicker(prev: Ticker): Ticker {
  const last = Number(prev.last_price);
  const drift = 0.00002; // very gentle drift per tick
  const shock = (Math.random() - 0.5) * 0.0005; // +/- 0.025%
  const nextLast = Math.max(0.01, last * (1 + drift + shock));

  const bid = nextLast * (1 - 0.0006);
  const ask = nextLast * (1 + 0.0006);

  const nextMax = Math.max(Number(prev.max_price), nextLast);
  const nextMin = Math.min(Number(prev.min_price), nextLast);

  const nextFunding = Math.max(
    -0.01,
    Math.min(0.01, Number(prev.funding_rate) + (Math.random() - 0.5) * 0.0001),
  );
  const nextIndex = nextLast * (1 + (Math.random() - 0.5) * 0.0008);
  const nextMark = nextLast * (1 + (Math.random() - 0.5) * 0.0006);

  // Approximate 24h change by comparing to a synthetic baseline
  const baseline = nextLast / (1 + 0.02 * Math.sin(Date.now() / 600000));
  const change24h = nextLast - baseline;

  const nextVolume = Number(prev.stats.volume_24h) + Math.max(0, (Math.random() - 0.4) * 5);
  const nextOpenInterest = Number(prev.open_interest) + (Math.random() - 0.5) * 5000;

  return {
    ...prev,
    best_ask_amount: toFixedString(1 + Math.random() * 5, 3),
    best_ask_price: toFixedString(ask, 2),
    best_bid_amount: toFixedString(1 + Math.random() * 5, 3),
    best_bid_price: toFixedString(bid, 2),
    funding_rate: toFixedString(nextFunding, 6),
    index_price: toFixedString(nextIndex, 2),
    last_price: toFixedString(nextLast, 2),
    mark_price: toFixedString(nextMark, 2),
    max_price: toFixedString(nextMax, 2),
    min_price: toFixedString(nextMin, 2),
    open_interest: toFixedString(nextOpenInterest, 2),
    stats: {
      change_24h: toFixedString(change24h, 2),
      volume_24h: toFixedString(nextVolume, 2),
    },
    timestamp: nowIso(),
  };
}

// New hook to subscribe to all instrument tickers at once (mock no-op)
export function useTickerSubscriptions() {
  // Intentionally left blank to preserve API surface during mocking.
}

// Original hook modified to provide a self-contained mock ticker stream
export function useTickerSubscription(instrumentName: string | undefined): Ticker | undefined {
  const [ticker, setTicker] = useState<Ticker | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!instrumentName) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTicker(undefined);
      return;
    }

    // Initialize fresh stream when instrument changes
    const initial = createInitialMockTicker(instrumentName);
    setTicker(initial);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setTicker((prev) => (prev ? stepTicker(prev) : createInitialMockTicker(instrumentName)));
    }, 8000); // significantly slower updates to reduce menu churn

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [instrumentName]);

  return ticker;
}
