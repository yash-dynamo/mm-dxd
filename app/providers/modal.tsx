'use client';

import {
  ConnectWalletModal,
  QRWalletModal,
  QrScanModal,
  RabbyMobileGuideModal,
  WalletSetupModal,
} from '@/components/modals';
import { useActionStore } from '@/stores';

/**
 * ModalProvider — wallet connect modal surface.
 *
 *   connect-wallet   → main connect dialog
 *   qr-wallet        → desktop QR for mobile linking
 *   qr-scan          → mobile camera scanner
 *   rabby-mobile-guide → Rabby mobile guide
 *   wallet-setup     → post-connect broker fee + agent registration
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
      {modal === 'wallet-setup' && <WalletSetupModal />}
    </>
  );
}

export default ModalProvider;
