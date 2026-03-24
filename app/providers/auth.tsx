'use client';

import { useAuthStore, useActionStore } from '@/stores';
import { FC, useEffect, Suspense, createContext, useContext } from 'react';
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

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthControllerContextValue {
  logout: () => Promise<void>;
}

const AuthControllerContext = createContext<AuthControllerContextValue | null>(null);

const useLogout = () => {
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
      {children}
    </AuthControllerContext.Provider>
  );
};
