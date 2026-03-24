import { HttpTransport, InfoClient } from '@hotstuff-labs/ts-sdk';
import server from '@/config/server';
import { isSdkTestnet } from '@/config';

const transport = new HttpTransport({
  isTestnet: isSdkTestnet,
  ...server.http,
});

const infoClient = new InfoClient({ transport });

export function useInfoClient() {
  return { infoClient };
}
