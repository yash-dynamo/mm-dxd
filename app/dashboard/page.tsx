'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { SessionCard } from '@/components/dashboard/SessionCard';

const Spin = () => (
  <svg className="animate-spin" width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function DashboardPage() {
  const { sessions, isLoadingSessions, sessionsError } = useDxdSessionsStore();
  const { listSessions } = useSessions();

  useEffect(() => {
    listSessions();
  }, []);

  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status === 'running' || s.status === 'starting').length;
    return { total: sessions.length, active };
  }, [sessions]);

  return (
    <div className="dash-page">
      <header className="dash-masthead">
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <p className="dash-eyebrow">Market making</p>
          <h1 className="dash-title">Sessions</h1>
          <p className="dash-subtitle">
            Monitor live PnL and status at a glance. Open a card for spreads, risk, and session controls.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Link href="/dashboard/new" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            + NEW SESSION
          </Link>
        </div>
      </header>

      {isLoadingSessions && (
        <div className="dash-loading">
          <Spin /> Loading sessions…
        </div>
      )}

      {sessionsError && (
        <div className="dash-alert" style={{ marginBottom: 24 }}>
          {sessionsError}
        </div>
      )}

      {!isLoadingSessions && sessions.length > 0 && (
        <section className="dash-stats dash-stats--grid" aria-label="Session summary">
          <div className="dash-stat">
            <p className="dash-stat-label">Total</p>
            <p className="dash-stat-value">{stats.total}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-label">Active</p>
            <p className="dash-stat-value" style={{ color: stats.active > 0 ? 'var(--gold)' : undefined }}>
              {stats.active}
            </p>
          </div>
        </section>
      )}

      {!isLoadingSessions && sessions.length === 0 && !sessionsError && (
        <div className="dash-empty">
          <div className="dash-empty-inner">
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
                fontStyle: 'italic',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 14px',
              }}
            >
              No sessions yet
            </p>
            <p
              style={{
                fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 auto 32px',
                maxWidth: '44ch',
              }}
            >
              Start your first market-making run — pick symbols, set global defaults, then launch from the composer.
            </p>
            <Link href="/dashboard/new" className="btn btn-primary">
              START SESSION
            </Link>
          </div>
        </div>
      )}

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
