import { SubscriptionClient, WebSocketTransport } from '@hotstuff-labs/ts-sdk';
import server from '@/config/server';
import { env } from '@/config';

const transport = new WebSocketTransport({
  env: env.NEXT_PUBLIC_ENVIRONMENT,
  ...server.ws,
});

const subscriptionClient = new SubscriptionClient({ transport });

export function useSubscriptionClient() {
  return { subscriptionClient };
}
