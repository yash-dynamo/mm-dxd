'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDxdAuthStore, useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { SessionCard } from '@/components/dashboard/SessionCard';

const Spin = () => (
  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function DashboardPage() {
  const { agentAddress } = useDxdAuthStore();
  const { sessions, isLoadingSessions, sessionsError } = useDxdSessionsStore();
  const { listSessions } = useSessions();

  const inferredAgentAddress = useMemo(
    () => agentAddress ?? sessions.find((s) => Boolean(s.agent_address))?.agent_address ?? null,
    [agentAddress, sessions],
  );
  const hasAgent = Boolean(inferredAgentAddress);
  const actionHref = hasAgent ? '/dashboard/new' : '/dashboard/agent?next=/dashboard/new';
  const actionLabel = hasAgent ? 'New Session' : 'Setup Agent';

  useEffect(() => { listSessions(); }, [listSessions]);

  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status === 'running' || s.status === 'starting').length;
    const stopped = sessions.filter((s) => s.status === 'stopped').length;
    return { total: sessions.length, active, stopped };
  }, [sessions]);

  return (
    <div className="dash-page dxd-page dxd-home-page">

      {/* ── Command card: title + stats + action ── */}
      <div className="dash-command-card">
        {/* Top accent line */}
        <div className="dash-command-card__accent" aria-hidden />

        {/* Top row: eyebrow + capsule button */}
        <div className="dash-command-card__top">
          <p className="dash-eyebrow">Market Making</p>
          <Link
            href={actionHref}
            className="btn btn-primary"
            style={
              hasAgent
                ? {
                    width: 'clamp(38px, 10vw, 54px)',
                    height: 'clamp(38px, 10vw, 54px)',
                    padding: 0,
                    borderRadius: 8,
                    fontSize: 'clamp(20px, 5.8vw, 34px)',
                    lineHeight: 1,
                    letterSpacing: 0,
                  }
                : { padding: '8px 12px', fontSize: '10px', letterSpacing: '0.06em', lineHeight: 1 }
            }
            aria-label={hasAgent ? 'New session' : 'Setup agent'}
          >
            {hasAgent ? '+' : actionLabel}
          </Link>
        </div>

        {/* Title */}
        <h1 className="dash-title" style={{ marginBottom: 20 }}>Sessions</h1>

        {/* Stats row — only when there are sessions */}
        {!isLoadingSessions && sessions.length > 0 && (
          <div className="dash-command-stats">
            <div className="dash-command-stat">
              <span className="dash-command-stat__value">{stats.total}</span>
              <span className="dash-command-stat__label">Total</span>
            </div>
            <div className="dash-command-stat__divider" aria-hidden />
            <div className="dash-command-stat">
              <span
                className="dash-command-stat__value"
                style={{ color: stats.active > 0 ? 'var(--green)' : undefined }}
              >
                {stats.active}
              </span>
              <span className="dash-command-stat__label">Active</span>
            </div>
            <div className="dash-command-stat__divider" aria-hidden />
            <div className="dash-command-stat">
              <span className="dash-command-stat__value" style={{ color: 'var(--text-dim)' }}>
                {stats.stopped}
              </span>
              <span className="dash-command-stat__label">Stopped</span>
            </div>
          </div>
        )}

        {/* Loading inside card */}
        {isLoadingSessions && (
          <div className="dash-command-loading">
            <Spin /> Fetching sessions…
          </div>
        )}
      </div>

      {/* ── Alerts ── */}
      {!isLoadingSessions && !hasAgent && (
        <div className="dash-alert" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span>No agent configured. Create one to launch sessions.</span>
          <Link href="/dashboard/agent?next=/dashboard/new" className="btn btn-outline-red" style={{ flexShrink: 0 }}>
            Setup Agent
          </Link>
        </div>
      )}
      {sessionsError && (
        <div className="dash-alert" style={{ marginBottom: 20 }}>{sessionsError}</div>
      )}

      {/* ── Empty state ── */}
      {!isLoadingSessions && sessions.length === 0 && !sessionsError && (
        <div className="dash-empty">
          <div className="dash-empty-inner">
            <div aria-hidden style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(88px, 16vw, 160px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(200,16,46,0.1)',
              lineHeight: 1,
              marginBottom: -16,
              userSelect: 'none',
              letterSpacing: -4,
            }}>
              0
            </div>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'var(--text-primary)',
              margin: '0 0 10px',
            }}>
              No sessions yet
            </p>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-md)',
              color: 'var(--text-muted)',
              lineHeight: 1.65,
              margin: '0 auto 28px',
              maxWidth: '40ch',
            }}>
              {hasAgent
                ? 'Pick symbols, tune defaults, and launch from the composer.'
                : 'Create your API agent first, then launch a market-making session.'}
            </p>
            <Link href={actionHref} className="dash-capsule-btn dash-capsule-btn--lg">
              <span className="dash-capsule-btn__dot" aria-hidden />
              {hasAgent ? 'Start Session' : 'Setup Agent'}
            </Link>
          </div>
        </div>
      )}

      {/* ── Session grid ── */}
      {!isLoadingSessions && sessions.length > 0 && (
        <div className="dash-grid" role="list">
          {sessions.map((s) => (
            <SessionCard key={s.session_id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
