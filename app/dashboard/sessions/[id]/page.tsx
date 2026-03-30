'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDxdSessionsStore, useDxdMetricsStore } from '@/stores';
import { useSessions, useMetrics } from '@/hooks/dxd';
import {
  DxdApiError,
  type SymbolMetrics,
  type ConfigPatch,
  type SymbolConfig,
  type TakerConfig,
} from '@/lib/dxd-api';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import { WarmupOverlay } from '@/components/dashboard/WarmupOverlay';
import { ConfigForm } from '@/components/dashboard/ConfigForm';
import { TakerConfigForm } from '@/components/dashboard/TakerConfigForm';
import type { HistoryRow } from '@/stores/slices/dxd/metrics';

function aggregateSessionKpis(metrics: Record<string, SymbolMetrics> | null) {
  if (!metrics || Object.keys(metrics).length === 0) return null;
  const vals = Object.values(metrics);
  const totalPnl = vals.reduce((s, m) => s + m.pnl, 0);
  const equity = vals[0].account_equity;
  const fills = vals.reduce((s, m) => s + m.total_fills, 0);
  const vol = vals.reduce((s, m) => s + m.total_volume_usd, 0);
  const avgSpread = vals.reduce((s, m) => s + m.spread_bps, 0) / vals.length;
  return { totalPnl, equity, fills, vol, avgSpread, ts: vals[0].ts };
}

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

function fmtSignedUsd(n: number, d = 2) {
  return `${n < 0 ? '-' : '+'}$${Math.abs(n).toFixed(d)}`;
}

function cls(n: number) {
  return n >= 0 ? 'dxd-pos' : 'dxd-neg';
}

const EMPTY_HISTORY_ROWS: never[] = [];

const statusStyles: Record<string, { bg: string; border: string; color: string }> = {
  running: { bg: 'rgba(0,200,100,0.06)', border: 'rgba(0,200,100,0.25)', color: 'var(--green)' },
  starting: { bg: 'rgba(201,162,39,0.06)', border: 'var(--border-gold)', color: 'var(--gold)' },
  stopped: { bg: 'var(--bg-card-alt)', border: 'var(--border-subtle)', color: 'var(--text-dim)' },
  error: { bg: 'rgba(204,51,51,0.06)', border: 'var(--border-red-medium)', color: 'var(--red-light)' },
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { sessions, activeSessionConfig, activeTakerConfig } = useDxdSessionsStore();
  const liveMetrics = useDxdMetricsStore((s) => s.liveMetrics[id] ?? null);
  const historyRows = useDxdMetricsStore((s) => s.history[id] ?? EMPTY_HISTORY_ROWS);
  const isWarmingUp = useDxdMetricsStore((s) => s.isWarmingUp[id] ?? false);
  const isRestarting = useDxdMetricsStore((s) => s.isRestarting[id] ?? false);

  const { stopSession, patchConfig, loadSessionConfig, fetchSession } = useSessions();
  const { stopPolling, handleConfigPatch, fetchHistory } = useMetrics(id);

  const session = sessions.find((s) => s.session_id === id);
  const isTakerSession = session?.strategy === 'taker';

  const [configPatch, setConfigPatch] = useState<Partial<SymbolConfig>>({});
  const [takerPatch, setTakerPatch] = useState<Partial<TakerConfig>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showHistoryChart, setShowHistoryChart] = useState(false);
  /** Empty store on refresh/deep link — fetch GET /sessions/{id} */
  const [sessionLoadError, setSessionLoadError] = useState<'none' | 'not_found' | 'error'>('none');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const alreadyHave = useDxdSessionsStore.getState().sessions.some((s) => s.session_id === id);
    if (alreadyHave) {
      setSessionLoadError('none');
      return;
    }

    let cancelled = false;
    setSessionLoadError('none');
    (async () => {
      try {
        await fetchSession(id);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DxdApiError && err.status === 404) setSessionLoadError('not_found');
        else setSessionLoadError('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, fetchSession]);

  useEffect(() => {
    if (!id) return;
    loadSessionConfig(id);
    fetchHistory();
  }, [id, loadSessionConfig, fetchHistory]);

  useEffect(() => {
    if (session && !selectedSymbol) {
      setSelectedSymbol(session.symbols[0] ?? null);
    }
  }, [session, selectedSymbol]);

  const kpi = useMemo(() => aggregateSessionKpis(liveMetrics), [liveMetrics]);

  const historyEvents = useMemo(() => {
    const rows = [...historyRows] as HistoryRow[];
    rows.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return rows.slice(0, 50).map((r) => ({
      ts: r.ts,
      symbol: r.symbol,
      line: `PnL ${fmtSignedUsd(r.pnl)} · spr ${fmt(r.spread_bps)}bps · vol ${fmt(r.vol_bps)}bps`,
    }));
  }, [historyRows]);

  const isRunning = session?.status === 'running' || session?.status === 'starting';

  const handleStop = async () => {
    setIsStopping(true);
    setStopError(null);
    try {
      await stopSession(id);
      stopPolling();
    } catch (err) {
      setStopError(err instanceof Error ? err.message : 'Failed to stop');
    } finally {
      setIsStopping(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!id) return;
    if (isTakerSession) {
      if (Object.keys(takerPatch).length === 0) return;
      await handleConfigPatch(() => patchConfig(id, takerPatch).then(() => {}));
      setTakerPatch({});
      return;
    }
    if (Object.keys(configPatch).length === 0) return;
    const patch: ConfigPatch = selectedSymbol
      ? { symbol: selectedSymbol, ...configPatch }
      : configPatch;
    await handleConfigPatch(() => patchConfig(id, patch).then(() => {}));
    setConfigPatch({});
  };

  if (!session) {
    if (sessionLoadError === 'not_found') {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-5xl)', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Session not found
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)', marginBottom: 20 }}>
            This ID does not exist or you no longer have access.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            BACK TO SESSIONS
          </button>
        </div>
      );
    }
    if (sessionLoadError === 'error') {
      return (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--red-light)', marginBottom: 16 }}>
            Could not load this session. Check your connection and try again.
          </p>
          <button type="button" className="btn btn-outline-red" onClick={() => router.refresh()}>
            RETRY
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '80px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' }}>
        <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading session…
      </div>
    );
  }

  const st = statusStyles[session.status] ?? statusStyles.stopped;

  return (
    <div className="dxd-page dxd-session-page">
      <section className="dxd-session-hero" aria-label="Session overview">
        <header className="dxd-session-top">
          <button type="button" className="dxd-back-link" onClick={() => router.push('/dashboard')} aria-label="Back to dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="dxd-back-link-label">Back to dashboard</span>
          </button>
          <div className="dxd-session-brand">
            <span className="dxd-brand-dot" aria-hidden />
            <span>Live session</span>
          </div>
          {isRunning && (
            <button
              type="button"
              onClick={handleStop}
              disabled={isStopping}
              className="dxd-btn-outline"
              style={{ opacity: isStopping ? 0.5 : 1 }}
            >
              {isStopping ? 'Stopping…' : 'Stop session'}
            </button>
          )}
          <div className="dxd-session-badges">
            <span className="dxd-badge dxd-mono" style={{ textTransform: 'uppercase' }}>
              {session.strategy ?? 'unknown'}
            </span>
            {session.symbols.map((sym) => (
              <span key={sym} className="dxd-badge">
                {sym}
              </span>
            ))}
            <span className="dxd-badge dxd-mono" style={{ color: st.color, borderColor: st.border }}>
              {session.status}
            </span>
            <span className="dxd-badge dxd-mono">
              id: {session.session_id.slice(0, 8)}…
            </span>
          </div>
        </header>

        <p className="dxd-session-meta">
          Started {new Date(session.started_at).toLocaleString()} · {session.symbols.length} symbol{session.symbols.length === 1 ? '' : 's'}
        </p>
      </section>

      {kpi && (
        <section className="dxd-kpi-grid" aria-label="Session KPIs">
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Session PnL</div>
            <div className={`dxd-kpi-v ${cls(kpi.totalPnl)}`}>{fmtSignedUsd(kpi.totalPnl)}</div>
            <div className="dxd-muted dxd-small">aggregate</div>
          </div>
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Equity</div>
            <div className="dxd-kpi-v">${fmt(kpi.equity)}</div>
            <div className="dxd-muted dxd-small dxd-mono">account</div>
          </div>
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Volume</div>
            <div className="dxd-kpi-v">${fmt(kpi.vol, 0)}</div>
            <div className="dxd-muted dxd-small">notional</div>
          </div>
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Fills</div>
            <div className="dxd-kpi-v">{kpi.fills}</div>
            <div className="dxd-muted dxd-small">total</div>
          </div>
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Avg spread</div>
            <div className="dxd-kpi-v dxd-mono">{fmt(kpi.avgSpread, 2)} bps</div>
            <div className="dxd-muted dxd-small">cross-symbol</div>
          </div>
          <div className="dxd-card dxd-kpi">
            <div className="dxd-kpi-k">Last tick</div>
            <div className="dxd-kpi-v dxd-small dxd-mono" style={{ fontSize: 13, fontWeight: 600 }}>
              {kpi.ts ?? '—'}
            </div>
            <div className="dxd-muted dxd-small">metrics</div>
          </div>
        </section>
      )}

      {stopError && <div className="dxd-error">Stop error: {stopError}</div>}

      <div className="dxd-layout">
        <div className="dxd-symbols-col">
          {isWarmingUp && isRunning ? (
            <WarmupOverlay />
          ) : liveMetrics ? (
            <MetricsPanel metrics={liveMetrics} isRestarting={isRestarting} historyRows={historyRows} />
          ) : (
            !isRunning && <div className="dxd-card dxd-muted">Session ended. No live metrics.</div>
          )}

          {historyRows.length > 0 && (
            <div className="dxd-chart-toggle-row">
              <button
                type="button"
                className="dxd-chart-toggle-btn"
                onClick={() => setShowHistoryChart((v) => !v)}
              >
                {showHistoryChart ? 'HIDE PNL CHART' : 'VIEW PNL CHART'}
                {selectedSymbol ? ` · ${selectedSymbol}` : ' · ALL SYMBOLS'}
              </button>
            </div>
          )}

          {historyRows.length > 0 && showHistoryChart && (
            <div className="dxd-chart-wrap">
              <MetricsChart rows={historyRows} symbol={selectedSymbol ?? undefined} />
            </div>
          )}

          {isRunning && (
            <div className="dxd-config-card">
          <button
            type="button"
            onClick={() => setShowConfigPanel((v) => !v)}
            className="w-full"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            <span>
              EDIT CONFIG{' '}
              {isRestarting && <span style={{ color: 'var(--gold)', fontWeight: 400, fontSize: 'var(--text-xs)' }}>(restarting…)</span>}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transition: 'transform var(--duration-fast)', transform: showConfigPanel ? 'rotate(180deg)' : '' }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

              {showConfigPanel && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Per-symbol selector */}
              {!isTakerSession && session.symbols.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSymbol(null)}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-label)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: !selectedSymbol ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
                      background: !selectedSymbol ? 'rgba(204,51,51,0.15)' : 'var(--bg-elevated)',
                      color: !selectedSymbol ? 'var(--red-light)' : 'var(--text-dim)',
                      cursor: 'pointer',
                    }}
                  >
                    ALL
                  </button>
                  {session.symbols.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setSelectedSymbol(sym)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-label)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: selectedSymbol === sym ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
                        background: selectedSymbol === sym ? 'rgba(204,51,51,0.15)' : 'var(--bg-elevated)',
                        color: selectedSymbol === sym ? 'var(--red-light)' : 'var(--text-dim)',
                        cursor: 'pointer',
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              )}

              {isTakerSession ? (
                <TakerConfigForm
                  value={takerPatch}
                  onChange={setTakerPatch}
                  defaults={activeTakerConfig ?? undefined}
                  disabled={isRestarting}
                />
              ) : (
                <ConfigForm
                  value={configPatch}
                  onChange={setConfigPatch}
                  defaults={
                    selectedSymbol
                      ? activeSessionConfig?.[selectedSymbol]
                      : activeSessionConfig?.[session.symbols[0]]
                  }
                  disabled={isRestarting}
                />
              )}

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={
                  isRestarting ||
                  (isTakerSession
                    ? Object.keys(takerPatch).length === 0
                    : Object.keys(configPatch).length === 0)
                }
                className="btn btn-primary"
                style={{
                  opacity:
                    isRestarting ||
                    (isTakerSession
                      ? Object.keys(takerPatch).length === 0
                      : Object.keys(configPatch).length === 0)
                      ? 0.3
                      : 1,
                }}
              >
                APPLY CONFIG
              </button>
            </div>
          )}
            </div>
          )}
        </div>

        <aside className="dxd-events">
          <div className="dxd-events-title">History snapshots</div>
          <div className="dxd-event-list">
            {historyEvents.length > 0 ? (
              historyEvents.map((e, i) => (
                <div key={`${e.ts}-${i}-${e.symbol}`} className="dxd-event-line">
                  <span className="dxd-event-meta dxd-mono">{e.ts}</span>
                  <div className="dxd-event-body">
                    <span className="dxd-mono" style={{ color: 'var(--dxd-muted)', marginRight: 6 }}>
                      {e.symbol}
                    </span>
                    {e.line}
                  </div>
                </div>
              ))
            ) : (
              <div className="dxd-muted dxd-small">No history rows yet.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
