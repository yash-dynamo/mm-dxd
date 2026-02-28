// Core providers used in the app shell (src/app/providers.tsx)
export * from './wallet';
export * from './auth';
export * from './modal';

// Optional data providers — not mounted in the default shell.
// Import and add them to src/app/providers.tsx when your pages need
// live trading data, user account data, or access-gating logic.
//
// export * from './trading-data';       // subscribe to instruments / tickers / orderbook
// export * from './user-trading-data';  // account summary, fees, referral data
// export * from './eligibility';        // checks user metadata & legal terms on connect
// export * from './access-guard';       // redirects to /join-waitlist if not whitelisted
