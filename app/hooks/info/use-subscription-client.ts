import { SubscriptionClient, WebSocketTransport } from '@hotstuff-labs/ts-sdk';
import server from '@/config/server';
import { isSdkTestnet } from '@/config';

const transport = new WebSocketTransport({
  isTestnet: isSdkTestnet,
  ...server.ws,
});

const subscriptionClient = new SubscriptionClient({ transport });

export function useSubscriptionClient() {
  return { subscriptionClient };
}
