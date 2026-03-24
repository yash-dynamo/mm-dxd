import { z as zod } from 'zod';

/**
 * Environment variable schema validation.
 * Validates required env vars at build/runtime and exports typed values.
 */
const envSchema = zod.object({
  // Wallet connect — required
  NEXT_PUBLIC_PRIVY_APP_ID: zod.string().min(1),
  NEXT_PUBLIC_PRIVY_CLIENT_ID: zod.string().min(1),
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: zod.string().min(1),

  // Backend / SDK — required (Hotstuff client is mainnet-only; no testnet toggle)
  NEXT_PUBLIC_API_URL: zod.union([zod.string().url(), zod.literal('')]).optional(),

  // Chain / RPC — optional (used by deposit / bridge hooks)
  NEXT_PUBLIC_RPC_URL: zod.string().optional(),

  // Waitlist countdown — optional (used by countdown hooks)
  NEXT_PUBLIC_COUNTDOWN_END_DATE: zod.string().optional(),

  // DXD market-making API — optional (falls back to localhost)
  NEXT_PUBLIC_DXD_API_URL: zod.string().url().optional(),
  // Broker settings for agent/MM order flow — optional
  NEXT_PUBLIC_BROKER_ADDRESS: zod.string().optional(),
  NEXT_PUBLIC_MAX_FEE_RATE: zod.string().optional(),
});

const envVars = {
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  NEXT_PUBLIC_PRIVY_CLIENT_ID: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID,
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_COUNTDOWN_END_DATE: process.env.NEXT_PUBLIC_COUNTDOWN_END_DATE,
  NEXT_PUBLIC_DXD_API_URL: process.env.NEXT_PUBLIC_DXD_API_URL,
  NEXT_PUBLIC_BROKER_ADDRESS: process.env.NEXT_PUBLIC_BROKER_ADDRESS,
  NEXT_PUBLIC_MAX_FEE_RATE: process.env.NEXT_PUBLIC_MAX_FEE_RATE,
};

const parsedEnv = envSchema.safeParse(envVars);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join('\n');
  throw new Error(`Environment variable validation failed:\n${errors}`);
}

export const env = parsedEnv.data;

/** Hotstuff ts-sdk `HttpTransport` / `WebSocketTransport` — app is mainnet-only. */
export const isSdkTestnet = false;
