import { NextResponse } from "next/server";

// Expanded list of popular crypto instruments
const symbols = [
  "BTC", "ETH", "SOL", "ARB", "PEPE", 
  "DOGE", "AVAX", "LINK", "MATIC", "OP",
  "SUI", "APT", "INJ", "TIA", "SEI"
];

export async function GET() {
  const apiKey =
    process.env.COINMARKETCAP_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY;
  const baseUrl =
    process.env.COINMARKETCAP_API_BASE_URL ?? "https://pro-api.coinmarketcap.com";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing CoinMarketCap API key." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${baseUrl}/v1/cryptocurrency/quotes/latest?symbol=${symbols.join(
        ","
      )}&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "CoinMarketCap request failed." },
        { status: response.status }
      );
    }

    const data = await response.json();

    const quotes = symbols.reduce<Record<string, { price: number; percent_change_24h: number }>>(
      (acc, symbol) => {
        const usd = data?.data?.[symbol]?.quote?.USD;
        acc[symbol] = {
          price: Number(usd?.price ?? 0),
          percent_change_24h: Number(usd?.percent_change_24h ?? 0),
        };
        return acc;
      },
      {}
    );

    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch CoinMarketCap prices." },
      { status: 502 }
    );
  }
}
