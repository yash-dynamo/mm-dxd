'use client';
import { RelayKitProvider, RelayKitTheme } from '@relayprotocol/relay-kit-ui';
import { wagmiConfig } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
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
import { useState, createContext, useContext, useMemo, useEffect, useRef } from 'react';
import { convertViemChainToRelayChain } from '@relayprotocol/relay-sdk';

const theme: RelayKitTheme = {
  // Typography - matching Poppins from your app
  font: 'Poppins, sans-serif',
  fontHeading: 'Poppins, sans-serif',

  // Primary colors - using your app's green palette
  primaryColor: '#93EA5D', // --primary-green from globals.css
  focusColor: '#ACF47F', // --primary-green-light
  subtleBackgroundColor: '#191919', // --background-tertiary / grey-800
  subtleBorderColor: '#303030', // --background-quaternary / grey-600

  // Text colors - matching your palette
  text: {
    default: '#FFFFFF', // --text-primary
    subtle: '#ADADAD', // --text-secondary / grey-400
    error: '#ED8071', // error.main from theme config
    success: '#ACF47F', // success.main from theme config
  },

  // Buttons - styled to match your app's button aesthetics
  buttons: {
    primary: {
      color: '#0F0F0F', // --text-dark / grey-900
      background: '#93EA5D', // --primary-green
      hover: {
        color: '#0F0F0F',
        background: '#ACF47F', // --primary-green-light
      },
    },
    cta: {
      fontStyle: 'normal',
    },
    secondary: {
      color: '#FFFFFF',
      background: '#303030', // grey-600
      hover: {
        color: '#FFFFFF',
        background: '#1e1d1d', // grey-700
      },
    },
    disabled: {
      color: '#747474', // grey-500
      background: '#191919', // grey-800
    },
  },

  // Input fields - dark with good contrast
  input: {
    background: '#191919', // grey-800
    borderRadius: '10px',
    color: '#FFFFFF',
  },

  // Loading skeleton
  skeleton: {
    background: '#303030', // grey-600
  },

  // Links - using primary green for consistency
  anchor: {
    color: '#93EA5D', // --primary-green
    hover: {
      color: '#ACF47F', // --primary-green-light
    },
  },

  // Dropdown menus
  dropdown: {
    background: '#191919', // grey-800
    borderRadius: '10px',
    border: '1px solid #303030', // subtle border for definition
  },

  // Widget container - matching your app's card style
  widget: {
    background: '#191919', // grey-900
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    card: {
      background: '#191919', // grey-800
      borderRadius: '12px',
      border: '1px solid #191919', // subtle border
      gutter: '14px',
    },
    selector: {
      background: '#303030', // grey-600
      hover: {
        background: '#454545', // grey-700
      },
    },
    swapCurrencyButtonBorderColor: '#303030',
    swapCurrencyButtonBorderWidth: '1px',
    swapCurrencyButtonBorderRadius: '4px',
  },

  // Modal overlay
  modal: {
    background: '#0F0F0F', // grey-900
    border: '1px solid #303030',
    borderRadius: '16px',
  },
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ''}
      config={{
        supportedChains: [mainnet, sepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
          showWalletUIs: false,
        },

        appearance: {
          theme: 'dark',
        },
      }}
    >
      <WagmiProviderWrapper>{children}</WagmiProviderWrapper>
    </PrivyProvider>
  );
}

function WagmiProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(new QueryClient());
  const chains = [
    convertViemChainToRelayChain(mainnet),
    convertViemChainToRelayChain(sepolia),
    convertViemChainToRelayChain(arbitrum),
    convertViemChainToRelayChain(optimism),
    convertViemChainToRelayChain(polygon),
    convertViemChainToRelayChain(base),
    convertViemChainToRelayChain(bsc),
    convertViemChainToRelayChain(avalanche),
    convertViemChainToRelayChain(linea),
    convertViemChainToRelayChain(scroll),
    convertViemChainToRelayChain(zksync),
  ];
  return (
    <QueryClientProvider client={queryClient}>
      <RelayKitProvider options={{ chains }} theme={theme}>
        <WagmiProvider config={wagmiConfig}>
          <HydrationGate>{children}</HydrationGate>
        </WagmiProvider>
      </RelayKitProvider>
    </QueryClientProvider>
  );
}

/**
 * HydrationGate
 * 
 * Tracks when both Wagmi and Privy have finished their initialization/reconnection.
 * This prevents race conditions where AuthProvider makes decisions before
 * the auth systems have restored their state.
 */

interface HydrationState {
  isWagmiReady: boolean;
  isPrivyReady: boolean;
  isFullyHydrated: boolean;
}

const HydrationContext = createContext<HydrationState>({
  isWagmiReady: false,
  isPrivyReady: false,
  isFullyHydrated: false,
});

const useHydrationState = () => useContext(HydrationContext);

function HydrationGate({ children }: { children: React.ReactNode }) {
  const { isReconnecting } = useAccount();
  const { ready: privyReady } = usePrivy();

  // Track if we've ever seen a "connected" or "disconnected" state from Wagmi
  // This handles the case where Wagmi starts in "reconnecting" state
  const hasWagmiSettled = useRef(false);
  const [isWagmiReady, setIsWagmiReady] = useState(false);

  useEffect(() => {
    // Wagmi is ready when it's not reconnecting
    // Status can be: 'connected', 'disconnected', or 'connecting'
    if (!isReconnecting) {
      hasWagmiSettled.current = true;
      setIsWagmiReady(true);
    }
  }, [isReconnecting]);

  // Also set ready after a timeout as fallback (in case reconnection hangs)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasWagmiSettled.current) {
        console.warn('Wagmi hydration timeout - forcing ready state');
        setIsWagmiReady(true);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, []);

  const hydrationState = useMemo<HydrationState>(() => ({
    isWagmiReady,
    isPrivyReady: privyReady,
    isFullyHydrated: isWagmiReady && privyReady,
  }), [isWagmiReady, privyReady]);

  return (
    <HydrationContext.Provider value={hydrationState}>
      {children}
    </HydrationContext.Provider>
  );
}
