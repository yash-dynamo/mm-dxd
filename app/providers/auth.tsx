'use client';

import { useAuthStore, useActionStore } from '@/stores';
import { FC, useEffect, useRef, Suspense, createContext, useContext } from 'react';
import { useAuthController } from '@/hooks/use-auth-controller';
import { useSearchParams } from 'next/navigation';
import { extractLinkParam, recoverFromQrPayload } from '@/utils/qr-recover';

// ─── QR link recovery ─────────────────────────────────────────────────────────
const QrLinkHandler: FC = () => {
  const searchParams = useSearchParams();
  const { setAddress, setStatus, setAgent, setMaster } = useAuthStore();
  const { setModal } = useActionStore();

  useEffect(() => {
    const link = searchParams.get('link');
    if (!link) return;

    const recover = async () => {
      const linkParam = extractLinkParam(link);
      await recoverFromQrPayload(linkParam, { setAddress, setMaster, setAgent, setStatus, setModal });
    };

    recover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// ─── Auto-opens wallet-setup when wallet connects but no agent exists ─────────
const WalletSetupTrigger: FC = () => {
  const status = useAuthStore((s) => s.status);
  const { setModal, modal } = useActionStore();
  const lastStatusRef = useRef<string>('');

  useEffect(() => {
    // Only fire when status *transitions* to 'connected' (not on every render)
    if (status === 'connected' && lastStatusRef.current !== 'connected') {
      // Don't override an already-open modal
      if (!modal || modal === 'connect-wallet') {
        setModal('wallet-setup');
      }
    }
    lastStatusRef.current = status;
  }, [status, modal, setModal]);

  return null;
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthControllerContextValue {
  logout: () => Promise<void>;
}

const AuthControllerContext = createContext<AuthControllerContextValue | null>(null);

export const useLogout = () => {
  const context = useContext(AuthControllerContext);
  if (!context) throw new Error('useLogout must be used within AuthProvider');
  return context.logout;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuthController();

  return (
    <AuthControllerContext.Provider value={{ logout }}>
      <Suspense fallback={null}>
        <QrLinkHandler />
      </Suspense>
      <WalletSetupTrigger />
      {children}
    </AuthControllerContext.Provider>
  );
};
