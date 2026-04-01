'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDxdAuthStore, useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { useAgentSetup } from '@/hooks/dxd';
import { SymbolSelector } from '@/components/dashboard/SymbolSelector';
import { ConfigForm } from '@/components/dashboard/ConfigForm';
import { TakerConfigForm } from '@/components/dashboard/TakerConfigForm';
import type { CreateSessionRequest, DxdStrategy, SymbolConfig, TakerConfig } from '@/lib/dxd-api';

export default function NewSessionPage() {
  const router = useRouter();
  const { agentAddress } = useDxdAuthStore();
  const { configDefaults, sessions, isLoadingDefaults } = useDxdSessionsStore();
  const { loadDefaults, createSession, listSessions } = useSessions();
  const { getAgentPrivateKey } = useAgentSetup();

  const [strategy, setStrategy] = useState<DxdStrategy>('maker');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [globalConfig, setGlobalConfig] = useState<Partial<SymbolConfig>>({});
  const [takerConfig, setTakerConfig] = useState<Partial<TakerConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agentPrivateKey = getAgentPrivateKey();
  const effectiveAgentAddress = agentAddress ?? sessions.find((s) => Boolean(s.agent_address))?.agent_address ?? null;
  const hasAgentForSession = Boolean(effectiveAgentAddress && agentPrivateKey);

  useEffect(() => {
    if (!hasAgentForSession) {
      router.replace('/dashboard/agent?next=/dashboard/new');
    }
  }, [hasAgentForSession, router]);

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  useEffect(() => {
    listSessions();
  }, [listSessions]);

  useEffect(() => {
    if (strategy !== 'taker' || !configDefaults?.taker_defaults) return;
    let cancelled = false;
    const sym = symbols[0];
    if (!sym) {
      queueMicrotask(() => {
        if (!cancelled) setTakerConfig({});
      });
      return () => {
        cancelled = true;
      };
    }
    const base = { ...configDefaults.taker_defaults };
    const extra = configDefaults.taker_defaults_by_symbol?.[sym] ?? {};
    queueMicrotask(() => {
      if (!cancelled) setTakerConfig({ ...base, ...extra });
    });

    return () => {
      cancelled = true;
    };
  }, [strategy, symbols, configDefaults]);

  const conflictSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          sessions
            .filter((s) => s.status === 'running' || s.status === 'starting')
            .flatMap((s) => s.symbols)
            .map((sym) => sym.trim().toUpperCase()),
        ),
      ),
    [sessions],
  );

  const phase: 1 | 2 | 3 = symbols.length === 0 ? 1 : isLoadingDefaults ? 2 : 3;
  const makerDefaults = useMemo(() => {
    const defaultsBySymbol = configDefaults?.defaults;
    if (!defaultsBySymbol) return undefined;

    const selectedSymbol = symbols[0];
    if (selectedSymbol && defaultsBySymbol[selectedSymbol]) {
      return defaultsBySymbol[selectedSymbol];
    }

    const firstAvailableSymbol = Object.keys(defaultsBySymbol)[0];
    return firstAvailableSymbol ? defaultsBySymbol[firstAvailableSymbol] : undefined;
  }, [configDefaults?.defaults, symbols]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symbols.length === 0 || !effectiveAgentAddress || !agentPrivateKey) return;
    if (strategy === 'taker' && symbols.length !== 1) {
      setError('Taker mode requires exactly one symbol.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateSessionRequest = {
        strategy,
        agent_address: effectiveAgentAddress,
        agent_private_key: agentPrivateKey,
        symbols,
        config:
          strategy === 'maker' && Object.keys(globalConfig).length > 0 ? globalConfig : undefined,
        taker_config:
          strategy === 'taker' && Object.keys(takerConfig).length > 0 ? takerConfig : undefined,
      };

      const session = await createSession(payload);
      router.push(`/dashboard/sessions/${session.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsSubmitting(false);
    }
  };

  if (!hasAgentForSession || !effectiveAgentAddress) {
    return (
      <div className="dash-loading">
        Redirecting to agent setup…
      </div>
    );
  }

  return (
    <div className="dash-page dash-page--new dxd-page dxd-new-page">
      <form onSubmit={handleSubmit} className="dash-new-page">
        <div className="dash-new-topbar">
          <button type="button" className="dash-back-btn" onClick={() => router.push('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="dash-new-topbar-titles">
            <p className="dash-eyebrow">Composer</p>
            <h1 className="dash-title">New session</h1>
          </div>
        </div>

        <p className="dash-new-lede">
          Choose maker (multi-symbol quoting) or taker (single symbol), pick markets, tune parameters, then start. Conflicting
          symbols already running elsewhere are disabled automatically.
        </p>

        <div className="dash-new-shell">
          <nav className="dash-new-stepper" aria-label="Steps">
            <div className={`dash-new-step ${phase === 1 ? 'is-active' : ''}`}>
              <strong>01</strong>
              Markets
              <span className="dash-new-step-sub">
                Symbol set
              </span>
            </div>
            <div className={`dash-new-step ${phase === 2 ? 'is-active' : ''}`}>
              <strong>02</strong>
              Parameters
              <span className="dash-new-step-sub">
                {strategy === 'taker' ? 'Taker config' : 'Global config'}
              </span>
            </div>
            <div className={`dash-new-step ${phase === 3 ? 'is-active' : ''}`}>
              <strong>03</strong>
              Launch
              <span className="dash-new-step-sub">
                Start engine
              </span>
            </div>
          </nav>

          <div className="dash-new-main">
            <section className="dash-panel dash-panel--new">
              <div className="dash-panel-head dash-panel-head--compact">
                <span className="dash-panel-num" aria-hidden>
                  01
                </span>
                <div>
                  <h2 className="dash-panel-title">Strategy and symbols</h2>
                  <p className="dash-panel-desc">
                    Maker quotes multiple PERPs; taker runs on exactly one. Active sessions reserve their symbols.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(['maker', 'taker'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStrategy(s);
                      setSymbols((prev) => (s === 'taker' && prev.length > 1 ? [prev[0]].filter(Boolean) : prev));
                    }}
                    style={{
                      fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-label)',
                      textTransform: 'uppercase',
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: strategy === s ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
                      background: strategy === s ? 'rgba(204,51,51,0.14)' : 'rgba(255,255,255,0.03)',
                      color: strategy === s ? 'var(--red-light)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease-out)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <SymbolSelector
                value={symbols}
                onChange={setSymbols}
                disabledSymbols={conflictSymbols}
                selectionMode={strategy === 'taker' ? 'single' : 'multi'}
              />
            </section>

            <section className="dash-panel dash-panel--new dash-panel--config-scroll">
              <div className="dash-panel-head dash-panel-head--compact">
                <span className="dash-panel-num" aria-hidden>
                  02
                </span>
                <div>
                  <h2 className="dash-panel-title">{strategy === 'taker' ? 'Taker config' : 'Global config'}</h2>
                  <p className="dash-panel-desc">
                    {strategy === 'taker'
                      ? 'Parameters for the one-account taker worker. Defaults refresh when you change the symbol.'
                      : 'Applied to every selected symbol for this start. Refine per-symbol settings on the session page after launch.'}
                  </p>
                </div>
              </div>
              {isLoadingDefaults ? (
                <p
                  style={{
                    fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Loading defaults…
                </p>
              ) : strategy === 'taker' ? (
                <TakerConfigForm
                  value={takerConfig}
                  onChange={setTakerConfig}
                  defaults={configDefaults?.taker_defaults}
                />
              ) : (
                <ConfigForm
                  value={globalConfig}
                  onChange={setGlobalConfig}
                  defaults={makerDefaults}
                />
              )}
            </section>
          </div>
        </div>

        <div className="dash-new-footer">
          {error && <div className="dash-alert">{error}</div>}
          <button
            type="submit"
            disabled={
              symbols.length === 0 ||
              isSubmitting ||
              (strategy === 'taker' && symbols.length !== 1)
            }
            className="btn btn-primary w-full lg:w-auto"
            style={{
              opacity:
                symbols.length === 0 || isSubmitting || (strategy === 'taker' && symbols.length !== 1)
                  ? 0.45
                  : 1,
            }}
          >
            {isSubmitting ? 'STARTING…' : 'START SESSION'}
          </button>
        </div>
      </form>
    </div>
  );
}
