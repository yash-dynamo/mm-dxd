'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useDxdAuthStore } from '@/stores';
import { dxdApi, DxdApiError } from '@/lib/dxd-api';
import { ConnectStep } from '@/components/dashboard/steps/ConnectStep';
import { SignInStep } from '@/components/dashboard/steps/SignInStep';
import { AgentSetupStep } from '@/components/dashboard/steps/AgentSetupStep';

const MKS_THEME_KEY = 'mks_dashboard_theme';

type MksTheme = 'dark' | 'light';

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const { token, isAuthenticated, agentAddress, clearDxdAuth } = useDxdAuthStore();
  const [authHydrated, setAuthHydrated] = useState(false);
  const [sessionValidated, setSessionValidated] = useState(false);
  const [mksTheme, setMksTheme] = useState<MksTheme>('dark');

  const walletConnected = isConnected && !!wagmiAddress;
  const hasDxdSession = isAuthenticated && !!token;

  useEffect(() => {
    try {
      const t = localStorage.getItem(MKS_THEME_KEY);
      if (t === 'light' || t === 'dark') setMksTheme(t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MKS_THEME_KEY, mksTheme);
    } catch {
      /* ignore */
    }
  }, [mksTheme]);

  useEffect(() => {
    const persist = useDxdAuthStore.persist;
    if (!persist?.hasHydrated) {
      setAuthHydrated(true);
      return;
    }
    setAuthHydrated(persist.hasHydrated());
    const unsubStart = persist.onHydrate(() => setAuthHydrated(false));
    const unsubFinish = persist.onFinishHydration(() => setAuthHydrated(true));
    return () => {
      unsubStart();
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (!authHydrated) {
      setSessionValidated(false);
      return;
    }

    if (!token) {
      setSessionValidated(true);
      return;
    }

    let cancelled = false;
    setSessionValidated(false);

    (async () => {
      try {
        await dxdApi.listSessions(token);
      } catch (err) {
        if (err instanceof DxdApiError && err.status === 401) {
          clearDxdAuth();
        }
      } finally {
        if (!cancelled) setSessionValidated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, token, clearDxdAuth]);

  if (!authHydrated || !sessionValidated) return null;

  if (!hasDxdSession && !walletConnected) return <ConnectStep />;
  if (!hasDxdSession) return <SignInStep />;

  if (!agentAddress && !walletConnected) return <ConnectStep />;
  if (!agentAddress) return <AgentSetupStep />;

  const handleLogout = () => {
    clearDxdAuth();
    disconnect();
    router.push('/');
  };

  return (
    <div className="dashboard-app dash-shell mks-dashboard" data-mks-theme={mksTheme}>
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <button type="button" className="dash-brand-btn" onClick={() => router.push('/dashboard')} aria-label="Dashboard home">
            <span className="dash-brand-dot" aria-hidden />
            XD
          </button>
          <div className="dash-topbar-actions">
            <div className="dash-agent-pill">
              Agent: {agentAddress.slice(0, 6)}…{agentAddress.slice(-4)}
            </div>
            <button
              type="button"
              className="mks-theme-toggle"
              onClick={() => setMksTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {mksTheme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-outline-red">
              DISCONNECT
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">{children}</main>
    </div>
  );
}
