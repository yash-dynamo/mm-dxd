export const isDevelopmentEnv = process.env.NEXT_PUBLIC_ENV === 'development';
export const isProductionEnv = process.env.ENV === 'prod';
export const isClientSide = typeof window !== 'undefined';
export const isDevClientSide =
  typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const isProdClientSide =
  typeof window !== 'undefined' && window.location.hostname.includes('syndr.com');

// Toggle to pause all Sentry reporting (server, edge, client). Flip to false when you want everything silent.
export const SENTRY_ENABLED = true;

export const EMPTY_FUN = () => {};
export const DEFAULT_CHART_SYMBOL = 'BTC-PERP';
