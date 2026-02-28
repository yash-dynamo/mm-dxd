import { env } from '@/config';

const baseUrl = env.NEXT_PUBLIC_API_URL;
const wsBaseUrl = baseUrl?.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

const server = {
  http: {
    ...(baseUrl
      ? {
        server: {
          testnet: {
            api: baseUrl,
            rpc: baseUrl,
          },
          mainnet: {
            api: baseUrl,
            rpc: baseUrl,
          },
        },
      }
      : {}),
  },
  ws: {
    ...(wsBaseUrl
      ? {
        server: {
          testnet: wsBaseUrl + '/ws/',
          mainnet: wsBaseUrl + '/ws/',
        },
      }
      : {}),
  },
};

export default server;
