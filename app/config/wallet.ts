import { CreateConnectorFn } from 'wagmi';
import {
  mainnet,
  sepolia,
  arbitrum,
  optimism,
  polygon,
  base,
  bsc,
  avalanche,
  linea,
  scroll,
  zksync,
} from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { phantom } from './phantom-connector';
import { createAppKit, AppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

// Metadata for AppKit modal
const metadata = {
  name: 'HotStuff',
  description: 'HotStuff Trading Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://app.hotstuff.trade',
  icons: ['/assets/logo.svg'],
};

// Networks for AppKit - cast to mutable array
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet,
  sepolia,
  arbitrum,
  optimism,
  polygon,
  base,
  bsc,
  avalanche,
  linea,
  scroll,
  zksync,];

// Create wagmi adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// MetaMask wallet ID for WalletConnect
const METAMASK_WALLET_ID = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';

// Lazy AppKit instance - created on first access
// This prevents eager initialization that can cause race conditions
let _appKitInstance: AppKit | null = null;
let _appKitInitializing = false;

/**
 * Get the AppKit instance (lazy initialization)
 * Returns null on server-side
 */
export function getAppKit(): AppKit | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (_appKitInstance) {
    return _appKitInstance;
  }

  if (_appKitInitializing) {
    return null;
  }

  _appKitInitializing = true;

  try {
    _appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata,
      features: {
        analytics: false,
        email: false, // We use Privy for email
        socials: false, // We use Privy for socials
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#00DC82', // Your brand green color
      },
      // Feature MetaMask at the top of the wallet list
      featuredWalletIds: [METAMASK_WALLET_ID],
    });
  } catch (error) {
    console.error('Failed to create AppKit:', error);
    _appKitInitializing = false;
    return null;
  }

  return _appKitInstance;
}

// For backwards compatibility - returns the lazy instance
// Components should prefer getAppKit() for explicit lazy loading
export const appKit = typeof window !== 'undefined' ? {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open: (options?: { view?: string }) => getAppKit()?.open(options as any),
  disconnect: () => getAppKit()?.disconnect(),
} : null;

export interface IWalletConnector {
  id: string;
  connector: CreateConnectorFn;
  walletName: string;
  icon: string;
  link: string;
  isInstalled: boolean;
}

// Individual wallet connectors for direct connections (optional - you can keep these for specific wallet buttons)
export const WalletConnectors: IWalletConnector[] = [
  {
    id: 'io.metamask',
    connector: metaMask(),
    walletName: 'MetaMask',
    icon: '/imgs/png/wallet-icons/metamask.png',
    link: 'https://metamask.io/download/',
    isInstalled: true,
  },
  {
    id: 'io.rabby',
    connector: injected(),
    walletName: 'Rabby Wallet',
    icon: '/imgs/png/wallet-icons/rabby.png',
    link: 'https://rabby.io/',
    isInstalled: true,
  },
  {
    id: 'io.phantom',
    connector: phantom(),
    walletName: 'Phantom',
    icon: '/imgs/png/wallet-icons/phantom.svg',
    link: 'https://phantom.app/',
    isInstalled: true,
  },
  {
    id: 'com.mpcvault.console',
    connector: injected(),
    walletName: 'MPC Vault',
    icon: '/imgs/png/wallet-icons/mpc-vault.svg',
    link: 'https://mpcvault.com/',
    isInstalled: true,
  },
];
