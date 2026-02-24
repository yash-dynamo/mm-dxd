"use client";

import { useEffect, useMemo, useState } from "react";

type TickerItem = {
  pair: string;
  value: string;
  change: string;
  up: boolean;
};

const fallbackItems: TickerItem[] = [
  { pair: "BTC/USD", value: "$0", change: "0.00%", up: true },
  { pair: "ETH/USD", value: "$0", change: "0.00%", up: true },
  { pair: "SOL/USD", value: "$0", change: "0.00%", up: true },
  { pair: "ARB/USD", value: "$0", change: "0.00%", up: true },
  { pair: "PEPE/USD", value: "$0", change: "0.00%", up: true },
];

const symbols = [
  { pair: "BTC/USD", symbol: "BTC" },
  { pair: "ETH/USD", symbol: "ETH" },
  { pair: "SOL/USD", symbol: "SOL" },
  { pair: "ARB/USD", symbol: "ARB" },
  { pair: "PEPE/USD", symbol: "PEPE" },
];

const formatPrice = (value: number) => {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1000)
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(8)}`;
};

const formatChange = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>(fallbackItems);

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        const data = await response.json();

        const quotes = symbols.map(({ pair, symbol }) => {
          const quote = data?.quotes?.[symbol];
          const price = Number(quote?.price ?? 0);
          const percentChange = Number(quote?.percent_change_24h ?? 0);

          return {
            pair,
            value: formatPrice(price),
            change: formatChange(percentChange),
            up: percentChange >= 0,
          };
        });

        if (
          !cancelled &&
          quotes.length > 0 &&
          quotes.some((item) => item.value !== "$0")
        ) {
          setItems(quotes);
        }
      } catch {
        // Keep last successful values if the API errors.
      }
    };

    fetchPrices();
    const interval = window.setInterval(fetchPrices, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const allItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="ticker-wrapper">
      {/* Left fade */}
      <div className="ticker-fade-left" />
      {/* Right fade */}
      <div className="ticker-fade-right" />

      <div
        className="animate-ticker"
        style={{
          display: "flex",
          gap: "0",
          whiteSpace: "nowrap",
          width: "max-content",
        }}
      >
        {allItems.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-pair">{item.pair}</span>
            <span className="ticker-value">{item.value}</span>
            <span className={`ticker-change ${item.up ? "ticker-change-up" : "ticker-change-down"}`}>
              {item.up ? "▲" : "▼"} {item.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
