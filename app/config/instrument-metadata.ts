export interface InstrumentMetadata {
  description?: string;
  grouping: Array<number>;
  links?: Array<{
    url: string;
    label: string;
  }>;
  category?: string;
  isTrending?: {
    mainnet: boolean;
    testnet: boolean;
  };
  // For Pre-IPO: multiplier to convert price to implied company valuation (e.g., 1 billion)
  valuationMultiplier?: number;
}

export const INSTRUMENT_METADATA: Record<string, InstrumentMetadata> = {
  'BTC-PERP': {
    description:
      'Bitcoin is a decentralized digital currency without a central bank or single administrator. It uses peer-to-peer technology to operate with no central authority or banks. Created by an anonymous person or group under the name Satoshi Nakamoto.',
    grouping: [1, 2, 5, 10, 100, 1000],
    links: [
      {
        url: 'https://bitcoin.org/bitcoin.pdf',
        label: 'Whitepaper',
      },
      {
        url: 'https://bitcoin.org',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/bitcoin/',
        label: 'CoinMarketCap',
      },
    ],
    isTrending: {
      mainnet: false,
      testnet: false,
    },
  },
  'ETH-PERP': {
    description:
      'Ethereum is a decentralized blockchain with smart contract functionality. Ether is the native cryptocurrency of the platform. Among cryptocurrencies, ether is second only to bitcoin in market capitalization. It is open-source software.',
    grouping: [0.1, 0.2, 0.5, 1, 10, 100],
    links: [
      {
        url: 'https://ethereum.org/whitepaper',
        label: 'Whitepaper',
      },
      {
        url: 'https://etherscan.io',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/ethereum/',
        label: 'CoinMarketCap',
      },
    ],
    isTrending: {
      mainnet: false,
      testnet: false,
    },
  },
  'SOL-PERP': {
    description:
      'Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today. It uses a unique hybrid consensus model combining Proof of History with Proof of Stake.',
    grouping: [0.01, 0.02, 0.05, 0.1, 1, 10],
    links: [
      {
        url: 'https://solana.com/solana-whitepaper.pdf',
        label: 'Whitepaper',
      },
      {
        url: 'https://solana.org',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/solana/',
        label: 'CoinMarketCap',
      },
    ],
    isTrending: {
      mainnet: false,
      testnet: false,
    },
  },
  'BNB-PERP': {
    description:
      'The Binance network spans Binance Chain, Binance Smart Chain, Binance Academy, Trust Wallet, and Research, all leveraging blockchain to power next-gen finance. BNB plays a key role in many of Binance’s projects.',
    grouping: [0.01, 0.02, 0.05, 0.1, 1, 10],
    links: [
      {
        url: 'https://docs.bnbchain.org/',
        label: 'Whitepaper',
      },
      {
        url: 'https://www.bnbchain.org',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/bnb/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'HYPE-PERP': {
    description:
      'Hyperliquid represents a cutting-edge blockchain platform, specifically designed to enhance the efficiency and performance of decentralized finance (DeFi) applications. At its core, Hyperliquid introduces a novel Layer 1 (L1) blockchain that is meticulously engineered from the ground up to optimize performance and scalability. This optimization is largely attributed to its proprietary consensus mechanism, HyperBFT, which plays a pivotal role in ensuring rapid transaction finality and robust security measures.',
    grouping: [0.001, 0.002, 0.005, 0.01, 0.1, 1],
    isTrending: {
      mainnet: true,
      testnet: false,
    },
    links: [
      {
        url: 'https://hyperliquid.gitbook.io/hyperliquid-docs',
        label: 'Whitepaper',
      },
      {
        url: 'https://hyperfoundation.org',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/hyperliquid/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'ZEC-PERP': {
    description:
      'Zcash is a cryptocurrency that offers two types of addresses: transparent addresses that are publicly visible on the Zcash blockchain and shielded addresses that are more private. Coinbase customers can receive Zcash from both transparent and shielded addresses and send Zcash to transparent addresses. Sending to shielded addresses is not supported at this time.',
    grouping: [0.01, 0.02, 0.05, 0.1, 1, 10],
    links: [
      {
        url: 'https://zcash.readthedocs.io',
        label: 'Whitepaper',
      },
      {
        url: 'https://z.cash',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/zcash/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'XRP-PERP': {
    description:
      'The XRP Ledger (XRPL) is an open-source, permissionless and decentralized technology. Benefits of the XRP Ledger include its low-cost ($0.0002 to transact), speed (settling transactions in 3-5 seconds), scalability (1,500 transactions per second) and inherently green attributes (carbon-neutral and energy-efficient).',
    grouping: [0.0001, 0.0002, 0.0005, 0.001, 0.01, 0.1],
    links: [
      {
        url: 'https://ripple.com/files/ripple_consensus_whitepaper.pdf',
        label: 'Whitepaper',
      },
      {
        url: 'https://xrpl.org',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/xrp/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'PAXG-PERP': {
    description:
      "PAX Gold (PAXG) is an Ethereum-based ERC-20 token backed 1:1 by physical gold stored in secure vaults, offering the stability of gold with blockchain's liquidity and transparency.",
    grouping: [0.1, 0.2, 0.5, 1, 10, 100],
    links: [
      {
        url: 'https://www.paxos.com/pax-gold',
        label: 'Whitepaper',
      },
      {
        url: 'https://www.paxos.com',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/pax-gold/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'ASTER-PERP': {
    description:
      'Aster is a next-generation decentralized exchange (DEX) specifically built for perpetual futures trading across multiple blockchains. ASTER serves as the utility and governance token of the Aster platform.',
    grouping: [0.00001, 0.00002, 0.00005, 0.0001, 0.001, 0.01],
    links: [
      {
        url: 'https://docs.asterdex.com',
        label: 'Whitepaper',
      },
      {
        url: 'https://www.asterdex.com',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/aster/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'PUMP-PERP': {
    description:
      'The PUMP crypto-asset is the official utility coin of the pump.fun utility coin launch platform and the swap.pump.fun automated market maker (AMM) protocol (together, the "Pump.Fun Protocols"). The PUMP crypto-asset will not be required in order to utilize the Pump.Fun Protocols, which remain permissionless. Holders of the PUMP crypto-asset may opt to participate in promotional give aways from the Pump.Fun Protocols. The PUMP crypto-asset is a utility coin that will be used alongside the pump.fun brand behind the Pump.Fun Protocols.',
    grouping: [0.000001, 0.00001, 0.0001],
    links: [
      {
        url: 'https://www.researchgate.net/publication/391601635_Pumpfun_and_the_Tokenization_of_Memes_A_Research_Analysis',
        label: 'Whitepaper',
      },
      {
        url: 'https://pump.fun',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/pump-fun',
        label: 'CoinMarketCap',
      },
    ],
  },
  'USDT/USDC': {
    description:
      'Tether (USDT) is an Ethereum token that is pegged to the value of a U.S. dollar (also known as a stablecoin). Tether’s issuer claims that USDT is backed by bank reserves and loans which match or exceed the value of USDT in circulation.\n\nUSDC is a digital dollar issued by Circle that is fully backed by US dollars and US dollar equivalents. USDC was developed to represent a US Dollar equivalent onchain, and is used to send, store, and receive money between people and businesses without the need for third-party financial institutions.',
    grouping: [0.00001, 0.00002, 0.00005, 0.0001, 0.001, 0.01],
    links: [
      {
        url: 'https://assets.ctfassets.net/vyse88cgwfbl/5UWgHMvz071t2Cq5yTw5vi/c9798ea8db99311bf90ebe0810938b01/TetherWhitePaper.pdf',
        label: 'Whitepaper',
      },
      {
        url: 'https://www.tether.to',
        label: 'Website',
      },
      {
        url: 'https://coinmarketcap.com/currencies/tether/',
        label: 'CoinMarketCap',
      },
    ],
  },
  'TSLA-PERP': {
    grouping: [0.01, 0.1, 1, 10, 100, 1000],
    category: 'Stocks',
    isTrending: {
      mainnet: true,
      testnet: true,
    },
  },
  'X-PERP': {
    grouping: [0.01, 0.1, 1, 10, 100, 1000],
    category: 'Pre-IPO',
    isTrending: {
      mainnet: true,
      testnet: true,
    },
    valuationMultiplier: 1_000_000_000, // Price represents valuation in billions
  },
  'GOLD-PERP': {
    grouping: [0.01, 0.1, 1, 10, 100, 1000],
    category: 'Metals',
    isTrending: {
      mainnet: true,
      testnet: true,
    },
  },
  'SILVER-PERP': {
    grouping: [0.01, 0.1, 1, 10, 100, 1000],
    category: 'Metals',
    isTrending: {
      mainnet: true,
      testnet: true,
    },
  },
};
// Default metadata fallback for unknown instruments
export const DEFAULT_METADATA: InstrumentMetadata = {
  description:
    'A cryptocurrency perpetual contract. Trade with leverage without an expiration date.',
  grouping: [0.01, 0.1, 1, 10, 100, 1000],
  links: [
    {
      url: 'https://coinmarketcap.com',
      label: 'CoinMarketCap',
    },
  ],
};

export const getInstrumentMetadata = (instrumentName: string): InstrumentMetadata => {
  return INSTRUMENT_METADATA[instrumentName] || DEFAULT_METADATA;
};
