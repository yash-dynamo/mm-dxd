'use client';

import {
  ConnectWalletModal,
  QRWalletModal,
  QrScanModal,
  RabbyMobileGuideModal,
} from '@/components/modals';
import { useActionStore } from '@/stores';

/**
 * ModalProvider — wallet connect modal surface only.
 *
 * Modals included:
 *   connect-wallet      → main connect dialog (email / google / wallets / more)
 *   qr-wallet           → desktop QR code for mobile device linking
 *   qr-scan             → mobile camera scanner for desktop QR
 *   rabby-mobile-guide  → step guide for Rabby mobile users
 *
 * To add more modals for your product UI, import and register them here.
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { modal } = useActionStore();

  return (
    <>
      {children}
      {modal === 'connect-wallet' && <ConnectWalletModal />}
      {modal === 'qr-wallet' && <QRWalletModal />}
      {modal === 'qr-scan' && <QrScanModal />}
      {modal === 'rabby-mobile-guide' && <RabbyMobileGuideModal />}
    </>
  );
}

export default ModalProvider;
