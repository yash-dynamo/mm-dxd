'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDxdSessionsStore, useDxdMetricsStore } from '@/stores';
import { useSessions, useMetrics } from '@/hooks/dxd';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import { WarmupOverlay } from '@/components/dashboard/WarmupOverlay';
import { ConfigForm } from '@/components/dashboard/ConfigForm';
import type { ConfigPatch, SymbolConfig } from '@/lib/dxd-api';

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

  const { sessions, activeSessionConfig } = useDxdSessionsStore();
  const liveMetrics = useDxdMetricsStore((s) => s.liveMetrics[id] ?? null);
  const historyRows = useDxdMetricsStore((s) => s.history[id] ?? EMPTY_HISTORY_ROWS);
  const isWarmingUp = useDxdMetricsStore((s) => s.isWarmingUp[id] ?? false);
  const isRestarting = useDxdMetricsStore((s) => s.isRestarting[id] ?? false);

  const { stopSession, patchConfig, loadSessionConfig } = useSessions();
  const { stopPolling, handleConfigPatch, fetchHistory } = useMetrics(id);

  const session = sessions.find((s) => s.session_id === id);

  const [configPatch, setConfigPatch] = useState<Partial<SymbolConfig>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadSessionConfig(id);
    fetchHistory();
  }, [id]);

  useEffect(() => {
    if (session && !selectedSymbol) {
      setSelectedSymbol(session.symbols[0] ?? null);
    }
  }, [session]);

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
    if (!id || Object.keys(configPatch).length === 0) return;
    const patch: ConfigPatch = selectedSymbol
      ? { symbol: selectedSymbol, ...configPatch }
      : configPatch;
    await handleConfigPatch(() => patchConfig(id, patch).then(() => {}));
    setConfigPatch({});
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' }}>
        Loading session…
      </div>
    );
  }

  const st = statusStyles[session.status] ?? statusStyles.stopped;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: 'var(--tracking-wide)',
            marginTop: 4,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          SESSIONS
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {session.symbols.map((sym) => (
              <span
                key={sym}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-label)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                }}
              >
                {sym}
              </span>
            ))}
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-label)',
                textTransform: 'uppercase',
                color: st.color,
                background: st.bg,
                border: `1px solid ${st.border}`,
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
              }}
            >
              {session.status}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xs)', color: 'var(--text-ghost)', marginTop: 6, letterSpacing: 'var(--tracking-wide)' }}>
            ID: {session.session_id} · Started {new Date(session.started_at).toLocaleString()}
          </p>
        </div>

        {isRunning && (
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="btn btn-outline-red"
            style={{ opacity: isStopping ? 0.5 : 1 }}
          >
            {isStopping ? 'STOPPING…' : 'STOP SESSION'}
          </button>
        )}
      </div>

      {stopError && (
        <div style={{ padding: '12px 16px', background: 'rgba(204,51,51,0.08)', border: '1px solid var(--border-red-medium)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--red-light)' }}>
          {stopError}
        </div>
      )}

      {/* Warmup or Live Metrics */}
      {isWarmingUp && isRunning ? (
        <WarmupOverlay />
      ) : liveMetrics ? (
        <MetricsPanel metrics={liveMetrics} isRestarting={isRestarting} />
      ) : (
        !isRunning && (
          <div style={{ padding: '40px 0', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>
            Session ended. No live metrics.
          </div>
        )
      )}

      {/* History chart */}
      {historyRows.length > 0 && (
        <MetricsChart rows={historyRows} symbol={selectedSymbol ?? undefined} />
      )}

      {/* Live Config Edit */}
      {isRunning && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setShowConfigPanel((v) => !v)}
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
              {session.symbols.length > 1 && (
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

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={Object.keys(configPatch).length === 0 || isRestarting}
                className="btn btn-primary"
                style={{ opacity: Object.keys(configPatch).length === 0 || isRestarting ? 0.3 : 1 }}
              >
                APPLY CONFIG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
