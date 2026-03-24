'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useDxdAuthStore } from '@/stores';
import { dxdApi, DxdApiError } from '@/lib/dxd-api';
import { ConnectStep } from '@/components/dashboard/steps/ConnectStep';
import { SignInStep } from '@/components/dashboard/steps/SignInStep';
import { AgentSetupStep } from '@/components/dashboard/steps/AgentSetupStep';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const { token, isAuthenticated, agentAddress, clearDxdAuth } = useDxdAuthStore();
  const [authHydrated, setAuthHydrated] = useState(useDxdAuthStore.persist.hasHydrated());
  const [sessionValidated, setSessionValidated] = useState(false);

  const walletConnected = isConnected && !!wagmiAddress;
  const hasDxdSession = isAuthenticated && !!token;

  useEffect(() => {
    const unsubStart = useDxdAuthStore.persist.onHydrate(() => setAuthHydrated(false));
    const unsubFinish = useDxdAuthStore.persist.onFinishHydration(() => setAuthHydrated(true));
    setAuthHydrated(useDxdAuthStore.persist.hasHydrated());
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
        // Real check: ensure persisted token still works against backend.
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

  // No fallback UI: wait silently until hydration + real session check complete.
  if (!authHydrated || !sessionValidated) return null;

  // If no DXD session exists, follow wallet -> sign flow.
  if (!hasDxdSession && !walletConnected) return <ConnectStep />;
  if (!hasDxdSession) return <SignInStep />;

  // Authenticated users can stay in dashboard after refresh without reconnecting.
  // Wallet is only required here if user still needs to create/register an agent.
  if (!agentAddress && !walletConnected) return <ConnectStep />;
  if (!agentAddress) return <AgentSetupStep />;

  const handleLogout = () => {
    clearDxdAuth();
    disconnect();
    router.push('/');
  };

  return (
    <div
      className="dashboard-app"
      style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Top nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-navbar)',
          background: 'var(--bg-overlay)',
          borderBottom: '1px solid var(--border-red-light)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px clamp(16px, 3vw, 28px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.35rem, 2.8vw, 1.85rem)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'var(--red)',
              letterSpacing: 'var(--tracking-logo)',
              textShadow: '0 0 20px rgba(204,51,51,0.4)',
            }}
          >
            XD
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                fontSize: 'var(--text-md)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
              }}
            >
              Agent: {agentAddress.slice(0, 6)}…{agentAddress.slice(-4)}
            </div>
            <button onClick={handleLogout} className="btn btn-outline-red">
              DISCONNECT
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) clamp(18px, 3vw, 32px)' }}>
        {children}
      </main>
    </div>
  );
}
