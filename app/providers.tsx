'use client';

import { WalletProvider } from './providers/wallet';
import { AuthProvider } from './providers/auth';
import { ModalProvider } from './providers/modal';
import { Toaster } from 'sonner'

// Inside your provider tree or layout body:
/**
 * Providers
 *
 * Wraps the app with the minimal set of providers required for:
 * - Wallet connect (Privy + Wagmi + Reown AppKit + RelayKit)
 * - Auth controller (syncs wallet/privy state to zustand)
 * - Wallet-connect modal surface (connect-wallet, qr-wallet, qr-scan, rabby-mobile-guide)
 *
 * All SDK/API hooks are available anywhere inside this tree.
 * Add additional providers here as your app grows.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AuthProvider>
        <ModalProvider>
          {children}
          <Toaster position="bottom-right" />
        </ModalProvider>
      </AuthProvider>
    </WalletProvider>
  );
}
