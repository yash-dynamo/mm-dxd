"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useLandingTickers } from "@/hooks/use-landing-tickers";
import { DXD_PERP_SYMBOLS } from "@/lib/dxd-api";

type TickerItem = {
  symbol: string;
  value: string;
  change: string;
  up: boolean;
};

// Extract base symbol from instrument name (e.g., "BTC-PERP" -> "BTC")
const getBaseSymbol = (instrumentName: string) => {
  return instrumentName.split("-")[0].split("/")[0];
};

// Static placeholders (aligned with DXD_PERP_SYMBOLS) while the info feed loads
const PLACEHOLDER_ITEMS: TickerItem[] = DXD_PERP_SYMBOLS.map((perp) => {
  const symbol = getBaseSymbol(perp);
  const value = symbol === "EURUSD" || symbol === "USDJPY" ? "—" : "$—";
  return { symbol, value, change: "—", up: true };
});

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

// Get logo path for a symbol
const getLogoPath = (symbol: string) => {
  return `/crypto/${symbol}.svg`;
};

export default function Ticker() {
  const { tickers } = useLandingTickers();

  const items = useMemo<TickerItem[]>(() => {
    const tickerEntries = Object.entries(tickers);
    
    if (tickerEntries.length === 0) {
      return [];
    }

    return tickerEntries
      .map(([name, ticker]) => {
        const symbol = getBaseSymbol(name);
        const price = parseFloat(ticker.mark_price || ticker.index_price || "0");
        const change = ticker.change_24h ?? 0;

        return {
          symbol,
          value: formatPrice(price),
          change: formatChange(change),
          up: change >= 0,
        };
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [tickers]);

  // Use live data if available, otherwise placeholder (shows instantly)
  const displayItems = items.length > 0 ? items : PLACEHOLDER_ITEMS;
  const allItems = useMemo(() => [...displayItems, ...displayItems], [displayItems]);

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
            <Image
              src={getLogoPath(item.symbol)}
              alt={item.symbol}
              width={20}
              height={20}
              className="ticker-logo"
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
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
