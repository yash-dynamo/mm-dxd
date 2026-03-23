'use client';

import Link from 'next/link';
import { Session } from '@/lib/dxd-api';
import { useDxdMetricsStore } from '@/stores';

const statusStyles: Record<string, { bg: string; border: string; color: string }> = {
  running: { bg: 'rgba(0,200,100,0.06)', border: 'rgba(0,200,100,0.25)', color: 'var(--green)' },
  starting: { bg: 'rgba(201,162,39,0.06)', border: 'var(--border-gold)', color: 'var(--gold)' },
  stopped: { bg: 'var(--bg-card-alt)', border: 'var(--border-subtle)', color: 'var(--text-dim)' },
  error: { bg: 'rgba(204,51,51,0.06)', border: 'var(--border-red-medium)', color: 'var(--red-light)' },
};

export function SessionCard({ session }: { session: Session }) {
  const liveMetrics = useDxdMetricsStore((s) => s.liveMetrics[session.session_id]);

  const totalPnl = liveMetrics
    ? Object.values(liveMetrics).reduce((sum, m) => sum + m.pnl, 0)
    : null;

  const startedAt = new Date(session.started_at).toLocaleString();
  const st = statusStyles[session.status] ?? statusStyles.stopped;

  return (
    <Link
      href={`/dashboard/sessions/${session.session_id}`}
      className="card-interactive"
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        textDecoration: 'none',
        transition: 'all var(--duration-normal) var(--ease-out)',
      }}
    >
      {/* Symbols + Status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {session.symbols.map((sym) => (
            <span
              key={sym}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-label)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
              }}
            >
              {sym}
            </span>
          ))}
        </div>
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
            padding: '3px 8px',
            flexShrink: 0,
          }}
        >
          {session.status}
        </span>
      </div>

      {/* PnL */}
      {totalPnl !== null && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: 'var(--tracking-label)', marginBottom: 2 }}>
            PNL
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-5xl)',
              fontStyle: 'italic',
              fontWeight: 500,
              color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          >
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USD
          </p>
        </div>
      )}

      {/* Meta */}
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: 'var(--tracking-wide)' }}>
        Started {startedAt}
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xs)', color: 'var(--text-ghost)', marginTop: 2 }}>
        Agent: {session.agent_address.slice(0, 8)}…
      </p>
    </Link>
  );
}
