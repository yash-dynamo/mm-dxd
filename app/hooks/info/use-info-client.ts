import { HttpTransport, InfoClient } from '@0xsyndr/ts-sdk';
import server from '@/config/server';
import { env } from '@/config';

const transport = new HttpTransport({
  env: env.NEXT_PUBLIC_ENVIRONMENT,
  ...server.http,
});

const infoClient = new InfoClient({ transport });

export function useInfoClient() {
  return { infoClient };
}
