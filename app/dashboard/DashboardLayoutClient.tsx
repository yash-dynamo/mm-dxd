'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useDxdAuthStore } from '@/stores';
import { dxdApi, DxdApiError } from '@/lib/dxd-api';
import { ConnectStep } from '@/components/dashboard/steps/ConnectStep';
import { SignInStep } from '@/components/dashboard/steps/SignInStep';

const DXD_THEME_KEY = 'dxd_dashboard_theme';

type DxdTheme = 'dark' | 'light';

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const { token, isAuthenticated, agentAddress, clearDxdAuth } = useDxdAuthStore();
  const [authHydrated, setAuthHydrated] = useState(false);
  const [sessionValidated, setSessionValidated] = useState(false);
  const [inferredAgentAddress, setInferredAgentAddress] = useState<string | null>(null);
  const [dxdTheme, setDxdTheme] = useState<DxdTheme>('dark');
  const themeThumbRef = useRef<HTMLSpanElement | null>(null);

  const walletConnected = isConnected && !!wagmiAddress;
  const hasDxdSession = isAuthenticated && !!token;
  const effectiveAgentAddress = agentAddress ?? inferredAgentAddress;

  useEffect(() => {
    try {
      const t = localStorage.getItem(DXD_THEME_KEY);
      if (t === 'light' || t === 'dark') setDxdTheme(t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DXD_THEME_KEY, dxdTheme);
    } catch {
      /* ignore */
    }
  }, [dxdTheme]);

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
      setInferredAgentAddress(null);
      setSessionValidated(true);
      return;
    }

    let cancelled = false;
    setSessionValidated(false);

    (async () => {
      try {
        const { sessions } = await dxdApi.listSessions(token);
        if (!agentAddress) {
          setInferredAgentAddress(sessions.find((s) => Boolean(s.agent_address))?.agent_address ?? null);
        }
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
  }, [authHydrated, token, clearDxdAuth, agentAddress]);

  if (!authHydrated || !sessionValidated) return null;

  if (!hasDxdSession && !walletConnected) return <ConnectStep />;
  if (!hasDxdSession) return <SignInStep />;

  if (!effectiveAgentAddress && !walletConnected) return <ConnectStep />;

  const handleLogout = () => {
    clearDxdAuth();
    disconnect();
    router.push('/');
  };

  const toggleTheme = async () => {
    const nextTheme: DxdTheme = dxdTheme === 'dark' ? 'light' : 'dark';
    const applyTheme = () => setDxdTheme(nextTheme);

    if (typeof window === 'undefined') {
      applyTheme();
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startViewTransition = (
      document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> };
      }
    ).startViewTransition;

    if (!startViewTransition || reducedMotion) {
      applyTheme();
      return;
    }

    const rect = themeThumbRef.current?.getBoundingClientRect();
    if (!rect) {
      applyTheme();
      return;
    }

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    try {
      const transition = startViewTransition(() => applyTheme());
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 560,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    } catch {
      applyTheme();
    }
  };

  return (
    <div className="dashboard-app dash-shell dxd-dashboard" data-dxd-theme={dxdTheme}>
      <header className="dash-topbar">
        <div className="dash-topbar-inner w-full max-w-none">
          <button type="button" className="dash-brand-btn" onClick={() => router.push('/')} aria-label="Go to landing page">
            <span className="dash-brand-dot" aria-hidden />
            DXD
          </button>
          <div className="dash-topbar-actions ml-auto w-full sm:w-auto">
            {effectiveAgentAddress ? (
              <div className="dash-agent-pill hidden md:inline-flex">
                Agent: {effectiveAgentAddress.slice(0, 6)}…{effectiveAgentAddress.slice(-4)}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/dashboard/agent?next=/dashboard')}
                className="dash-top-action-btn min-w-[120px]"
              >
                SET UP AGENT
              </button>
            )}
            <button
              type="button"
              className={`dxd-theme-switch${dxdTheme === 'light' ? ' is-light' : ''}`}
              onClick={toggleTheme}
              aria-label={`Switch to ${dxdTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={dxdTheme === 'light'}
            >
              <span className="dxd-theme-switch__thumb" ref={themeThumbRef} aria-hidden>
                <span className="dxd-theme-switch__thumb-icon dxd-theme-switch__thumb-icon--dark">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
                  </svg>
                </span>
                <span className="dxd-theme-switch__thumb-icon dxd-theme-switch__thumb-icon--light">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                </span>
              </span>
            </button>
            <button type="button" onClick={handleLogout} className="dash-top-action-btn dash-top-action-btn--danger min-w-[110px]">
              DISCONNECT
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">{children}</main>
    </div>
  );
}
