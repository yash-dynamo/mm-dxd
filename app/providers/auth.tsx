'use client';

import { useAuthStore } from '@/stores';
import { FC, useEffect, Suspense, createContext, useContext } from 'react';
import { useAuthController } from '@/hooks/use-auth-controller';
import { useSearchParams } from 'next/navigation';
import { extractLinkParam, recoverFromQrPayload } from '@/utils/qr-recover';
import { useActionStore } from '@/stores';

// Separate component for search params logic to be wrapped in Suspense
const QrLinkHandler: FC = () => {
  const searchParams = useSearchParams();
  const { setAddress, setStatus, setAgent, setMaster } = useAuthStore();
  const { setModal } = useActionStore();

  useEffect(() => {
    const link = searchParams.get('link');
    if (!link) return;

    const recover = async () => {
      const linkParam = extractLinkParam(link);
      await recoverFromQrPayload(linkParam, {
        setAddress,
        setMaster,
        setAgent,
        setStatus,
        setModal,
      });
    };

    recover();
    // intentionally exclude dependencies to avoid re-running on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};


// Context to provide logout function without requiring multiple useAuthController instances
interface AuthControllerContextValue {
  logout: () => Promise<void>;
}

const AuthControllerContext = createContext<AuthControllerContextValue | null>(null);

/**
 * Hook to access the logout function from AuthController
 * Use this instead of calling useAuthController() directly in other hooks/components
 */
export const useLogout = () => {
  const context = useContext(AuthControllerContext);
  if (!context) {
    throw new Error('useLogout must be used within AuthProvider');
  }
  return context.logout;
};

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the unified auth controller - this handles all auth state synchronization
  // Called ONLY here to avoid duplicate effects
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
