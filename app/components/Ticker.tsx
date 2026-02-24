"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type TickerItem = {
  pair: string;
  symbol: string;
  value: string;
  change: string;
  up: boolean;
};

// Crypto logos from CoinGecko CDN
const LOGO_BASE = "https://assets.coingecko.com/coins/images";
const logos: Record<string, string> = {
  BTC: `${LOGO_BASE}/1/small/bitcoin.png`,
  ETH: `${LOGO_BASE}/279/small/ethereum.png`,
  SOL: `${LOGO_BASE}/4128/small/solana.png`,
  ARB: `${LOGO_BASE}/16547/small/photo_2023-03-29_21.11.00.jpeg`,
  PEPE: `${LOGO_BASE}/29850/small/pepe-token.jpeg`,
  DOGE: `${LOGO_BASE}/5/small/dogecoin.png`,
  AVAX: `${LOGO_BASE}/12559/small/Avalanche_Circle_RedWhite_Trans.png`,
  LINK: `${LOGO_BASE}/877/small/chainlink-new-logo.png`,
  MATIC: `${LOGO_BASE}/4713/small/polygon.png`,
  OP: `${LOGO_BASE}/25244/small/Optimism.png`,
  SUI: `${LOGO_BASE}/26375/small/sui_asset.jpeg`,
  APT: `${LOGO_BASE}/26455/small/aptos_round.png`,
  INJ: `${LOGO_BASE}/12882/small/Secondary_Symbol.png`,
  TIA: `${LOGO_BASE}/31967/small/tia.jpg`,
  SEI: `${LOGO_BASE}/28205/small/Sei_Logo_-_Transparent.png`,
};

const symbols = [
  { pair: "BTC/USD", symbol: "BTC" },
  { pair: "ETH/USD", symbol: "ETH" },
  { pair: "SOL/USD", symbol: "SOL" },
  { pair: "ARB/USD", symbol: "ARB" },
  { pair: "PEPE/USD", symbol: "PEPE" },
  { pair: "DOGE/USD", symbol: "DOGE" },
  { pair: "AVAX/USD", symbol: "AVAX" },
  { pair: "LINK/USD", symbol: "LINK" },
  { pair: "MATIC/USD", symbol: "MATIC" },
  { pair: "OP/USD", symbol: "OP" },
  { pair: "SUI/USD", symbol: "SUI" },
  { pair: "APT/USD", symbol: "APT" },
  { pair: "INJ/USD", symbol: "INJ" },
  { pair: "TIA/USD", symbol: "TIA" },
  { pair: "SEI/USD", symbol: "SEI" },
];

const fallbackItems: TickerItem[] = symbols.map(({ pair, symbol }) => ({
  pair,
  symbol,
  value: "$0",
  change: "0.00%",
  up: true,
}));

const formatPrice = (value: number) => {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1000)
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
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
            symbol,
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
            {logos[item.symbol] && (
              <Image
                src={logos[item.symbol]}
                alt={item.symbol}
                width={20}
                height={20}
                className="ticker-logo"
                unoptimized
              />
            )}
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-value">{item.value}</span>
            <span className={`ticker-change ${item.up ? "ticker-change-up" : "ticker-change-down"}`}>
              <span className="ticker-arrow">{item.up ? "▲" : "▼"}</span>
              {item.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
