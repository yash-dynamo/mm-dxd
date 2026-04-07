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

type MakerPresetKey = 'volume-making' | 'positive-pnl';

const MAKER_PRESETS: Record<
  MakerPresetKey,
  { label: string; description: string; values: Partial<SymbolConfig> }
> = {
  'volume-making': {
    label: 'Volume-Making',
    description: 'More fills, higher turnover.',
    values: {
      min_spread_bps: 3,
      levels: 5,
      level_spacing_bps: 1.2,
      order_size_usd: 180,
      target_exposure_x: 2.2,
      market_bias: 0,
      use_alpha: false,
      fixed_tp_enabled: false,
      spread_vol_mult: 0.7,
      close_spread_bps: 2.5,
      inventory_skew_bps: 8,
      max_inventory: 6,
      leverage: 4,
      level_size_scale: 1.1,
      close_threshold_usd: 18,
      inv_skew_start_pct: 60,
      inv_skip_open_pct: 92,
      toxic_threshold: 0.7,
      max_loss_pct: 6,
      guard_max_session_loss_usd: 1200,
      guard_max_drawdown_pct: 8,
      guard_cooldown_s: 45,
      guard_loss_streak_trigger: 6,
      adx_regime_enabled: false,
      supertrend_enabled: false,
      pivot_enabled: false,
      noise_bps: 0.5,
    },
  },
  'positive-pnl': {
    label: 'Positive PnL',
    description: 'Risk-first, steadier PnL.',
    values: {
      min_spread_bps: 8,
      levels: 3,
      level_spacing_bps: 3,
      order_size_usd: 90,
      target_exposure_x: 1.2,
      market_bias: 0,
      use_alpha: true,
      fixed_tp_enabled: true,
      fixed_tp_bps: 10,
      spread_vol_mult: 1.25,
      close_spread_bps: 5,
      alpha_bps: 10,
      inventory_skew_bps: 18,
      max_inventory: 3,
      leverage: 2,
      level_size_scale: 1.2,
      close_threshold_usd: 12,
      inv_skew_start_pct: 35,
      inv_skip_open_pct: 70,
      toxic_threshold: 0.45,
      max_loss_pct: 3,
      guard_max_session_loss_usd: 600,
      guard_max_drawdown_pct: 4,
      guard_cooldown_s: 90,
      guard_loss_streak_trigger: 4,
      adx_regime_enabled: true,
      supertrend_enabled: true,
      pivot_enabled: true,
      noise_bps: 0.2,
    },
  },
};

export default function NewSessionPage() {
  const router = useRouter();
  const { agentAddress } = useDxdAuthStore();
  const { configDefaults, sessions, isLoadingDefaults } = useDxdSessionsStore();
  const { loadDefaults, createSession, listSessions } = useSessions();
  const { getAgentPrivateKey } = useAgentSetup();

  const [strategy, setStrategy] = useState<DxdStrategy>('maker');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [globalConfig, setGlobalConfig] = useState<Partial<SymbolConfig>>({});
  const [selectedMakerPreset, setSelectedMakerPreset] = useState<MakerPresetKey | null>(null);
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

  const applyMakerPreset = (preset: MakerPresetKey) => {
    setSelectedMakerPreset(preset);
    setGlobalConfig((prev) => ({ ...prev, ...MAKER_PRESETS[preset].values }));
  };

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
                      background: strategy === s ? 'rgba(200, 16, 46,0.14)' : 'rgba(255,255,255,0.03)',
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
                <>
                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          letterSpacing: 'var(--tracking-label)',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        AI presets
                      </span>
                      <span
                        title="Quick starter profiles for Global Config. Pick one, then fine-tune fields below."
                        aria-label="AI presets info"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-dim)',
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: '14px',
                          textAlign: 'center',
                          cursor: 'help',
                          userSelect: 'none',
                        }}
                      >
                        i
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                      {(Object.keys(MAKER_PRESETS) as MakerPresetKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyMakerPreset(key)}
                          style={{
                            textAlign: 'left',
                            fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: selectedMakerPreset === key ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
                            background:
                              selectedMakerPreset === key
                                ? 'linear-gradient(180deg, rgba(200, 16, 46,0.14), rgba(200, 16, 46,0.06))'
                                : 'rgba(255,255,255,0.03)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all var(--duration-fast) var(--ease-out)',
                            boxShadow:
                              selectedMakerPreset === key
                                ? '0 0 0 1px rgba(200, 16, 46, 0.2) inset'
                                : 'none',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                                letterSpacing: 'var(--tracking-label)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {MAKER_PRESETS[key].label}
                            </span>
                            {selectedMakerPreset === key && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  color: 'var(--text-dim)',
                                }}
                              >
                                Active
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              lineHeight: 1.35,
                              color: 'var(--text-dim)',
                            }}
                          >
                            {MAKER_PRESETS[key].description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <ConfigForm
                    value={globalConfig}
                    onChange={setGlobalConfig}
                    defaults={makerDefaults}
                  />
                </>
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
            className="btn btn-primary w-full lg:w-auto dash-start-btn"
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
