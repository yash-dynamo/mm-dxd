import { NextResponse } from 'next/server';

/**
 * CoinMarketCap `cryptocurrency/quotes/latest` symbols (crypto tickers only).
 * Covers assets aligned with `DXD_PERP_SYMBOLS` in `@/lib/dxd-api` where CMC has a
 * direct match: HYPE, XRP, ZEC, BNB, PAXG (proxy for GOLD-PERP). Oil/gas/forex/silver
 * perps have no stable crypto `symbol=` on this endpoint, so they are omitted.
 */
const SYMBOLS = [
  'APT',
  'ARB',
  'AVAX',
  'BNB',
  'BTC',
  'DOGE',
  'ETH',
  'HYPE',
  'INJ',
  'LINK',
  'MATIC',
  'OP',
  'PAXG',
  'PEPE',
  'SEI',
  'SOL',
  'SUI',
  'TIA',
  'XRP',
  'ZEC',
] as const;

type Quote = { price: number; percent_change_24h: number };

const toQuote = (usd: unknown): Quote => {
  const quote = (usd ?? {}) as { price?: number; percent_change_24h?: number };
  return {
    price: Number(quote.price ?? 0),
    percent_change_24h: Number(quote.percent_change_24h ?? 0),
  };
};

export async function GET() {
  const apiKey = process.env.COINMARKETCAP_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl = process.env.COINMARKETCAP_API_BASE_URL ?? 'https://pro-api.coinmarketcap.com';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing CoinMarketCap API key.' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${baseUrl}/v1/cryptocurrency/quotes/latest?symbol=${SYMBOLS.join(',')}&convert=USD`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'CoinMarketCap request failed.' }, { status: response.status });
    }

    const data = await response.json();
    const quotes = SYMBOLS.reduce<Record<string, Quote>>((acc, symbol) => {
      acc[symbol] = toQuote(data?.data?.[symbol]?.quote?.USD);
      return acc;
    }, {});

    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: 'Unable to fetch CoinMarketCap prices.' }, { status: 502 });
  }
}
