'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { SessionCard } from '@/components/dashboard/SessionCard';

const Spin = () => (
  <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-7xl)',
              fontWeight: 500,
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-normal)',
            }}
          >
            Sessions
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)', marginTop: 4 }}>
            Your market-making history
          </p>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">
          + NEW SESSION
        </Link>
      </div>

      {/* Loading */}
      {isLoadingSessions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '80px 0',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <Spin /> Loading sessions…
        </div>
      )}

      {/* Error */}
      {sessionsError && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(204,51,51,0.08)',
            border: '1px solid var(--border-red-medium)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--red-light)',
          }}
        >
          {sessionsError}
        </div>
      )}

      {/* Empty */}
      {!isLoadingSessions && sessions.length === 0 && !sessionsError && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-5xl)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            No sessions yet
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)', marginTop: 6, marginBottom: 24 }}>
            Start your first market-making session to see it here.
          </p>
          <Link href="/dashboard/new" className="btn btn-primary">
            START SESSION
          </Link>
        </div>
      )}

      {/* Session grid */}
      {!isLoadingSessions && sessions.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {sessions.map((s) => (
            <SessionCard key={s.session_id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
