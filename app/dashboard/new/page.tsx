'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDxdAuthStore, useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { useAgentSetup } from '@/hooks/dxd';
import { SymbolSelector } from '@/components/dashboard/SymbolSelector';
import { ConfigForm } from '@/components/dashboard/ConfigForm';
import { env } from '@/config/env';
import type { CreateSessionRequest, SymbolConfig } from '@/lib/dxd-api';

export default function NewSessionPage() {
  const router = useRouter();
  const { agentAddress } = useDxdAuthStore();
  const { configDefaults, sessions, isLoadingDefaults } = useDxdSessionsStore();
  const { loadDefaults, createSession } = useSessions();
  const { getAgentPrivateKey } = useAgentSetup();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [globalConfig, setGlobalConfig] = useState<Partial<SymbolConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brokerAddress = env.NEXT_PUBLIC_BROKER_ADDRESS;
  const maxFeeRate = env.NEXT_PUBLIC_MAX_FEE_RATE ?? '0.001';

  useEffect(() => {
    loadDefaults();
  }, []);

  const conflictSymbols = sessions
    .filter((s) => s.status === 'running' || s.status === 'starting')
    .flatMap((s) => s.symbols);

  const phase: 1 | 2 | 3 = symbols.length === 0 ? 1 : isLoadingDefaults ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symbols.length === 0 || !agentAddress) return;

    const pk = getAgentPrivateKey();
    if (!pk) {
      setError('Agent private key not found in session. Please set up your agent wallet again.');
      return;
    }
    if (!brokerAddress) {
      setError('Broker address is not configured. Set NEXT_PUBLIC_BROKER_ADDRESS in .env.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateSessionRequest = {
        agent_address: agentAddress,
        agent_private_key: pk,
        symbols,
        config: Object.keys(globalConfig).length > 0 ? globalConfig : undefined,
        broker_address: brokerAddress,
        broker_config: {
          broker_address: brokerAddress,
          max_fee_rate: maxFeeRate,
        },
      };

      const session = await createSession(payload);
      router.push(`/dashboard/sessions/${session.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dash-page dash-page--new">
      <form onSubmit={handleSubmit} className="dash-new-page">
        <div className="dash-new-topbar">
          <button type="button" className="dash-back-btn" onClick={() => router.back()}>
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
          Choose perpetual symbols, optionally tune global defaults, then start. Conflicting symbols already running elsewhere are
          disabled automatically.
        </p>

        <div className="dash-new-shell">
          <nav className="dash-new-stepper" aria-label="Steps">
            <div className={`dash-new-step ${phase === 1 ? 'is-active' : ''}`}>
              <strong>01</strong>
              Markets
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-dim)', marginTop: 2 }}>
                Symbol set
              </span>
            </div>
            <div className={`dash-new-step ${phase === 2 ? 'is-active' : ''}`}>
              <strong>02</strong>
              Parameters
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-dim)', marginTop: 2 }}>
                Global config
              </span>
            </div>
            <div className={`dash-new-step ${phase === 3 ? 'is-active' : ''}`}>
              <strong>03</strong>
              Launch
              <span style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-dim)', marginTop: 2 }}>
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
                  <h2 className="dash-panel-title">Symbols</h2>
                  <p className="dash-panel-desc">Select one or more PERP markets for this session. Active sessions reserve their symbols.</p>
                </div>
              </div>
              <SymbolSelector value={symbols} onChange={setSymbols} disabledSymbols={conflictSymbols} />
            </section>

            <section className="dash-panel dash-panel--new dash-panel--config-scroll">
              <div className="dash-panel-head dash-panel-head--compact">
                <span className="dash-panel-num" aria-hidden>
                  02
                </span>
                <div>
                  <h2 className="dash-panel-title">Global config</h2>
                  <p className="dash-panel-desc">
                    Applied to every selected symbol for this start. You can refine per-symbol settings on the session page after launch.
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
              ) : (
                <ConfigForm
                  value={globalConfig}
                  onChange={setGlobalConfig}
                  defaults={configDefaults?.defaults?.['HYPE-PERP']}
                />
              )}
            </section>
          </div>
        </div>

        <div className="dash-new-footer">
          {error && <div className="dash-alert">{error}</div>}
          <button
            type="submit"
            disabled={symbols.length === 0 || isSubmitting}
            className="btn btn-primary"
            style={{
              opacity: symbols.length === 0 || isSubmitting ? 0.45 : 1,
            }}
          >
            {isSubmitting ? 'STARTING…' : 'START SESSION'}
          </button>
        </div>
      </form>
    </div>
  );
}
