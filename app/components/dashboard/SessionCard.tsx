'use client';

import Link from 'next/link';
import { Session } from '@/lib/dxd-api';
import { useDxdMetricsStore } from '@/stores';

const statusStyles: Record<string, { bg: string; border: string; color: string; rail: string }> = {
  running: {
    bg: 'color-mix(in srgb, var(--mks-pos, var(--green)) 14%, transparent)',
    border: 'color-mix(in srgb, var(--mks-pos, var(--green)) 38%, var(--mks-border, transparent) 62%)',
    color: 'var(--mks-pos, var(--green))',
    rail: 'color-mix(in srgb, var(--mks-pos, var(--green)) 72%, transparent)',
  },
  starting: {
    bg: 'color-mix(in srgb, var(--gold) 14%, transparent)',
    border: 'color-mix(in srgb, var(--gold) 45%, var(--mks-border, transparent) 55%)',
    color: 'var(--gold)',
    rail: 'color-mix(in srgb, var(--gold) 72%, transparent)',
  },
  stopped: {
    bg: 'var(--mks-panel-soft, var(--bg-card-alt))',
    border: 'var(--mks-border, var(--border-subtle))',
    color: 'var(--mks-muted, var(--text-dim))',
    rail: 'var(--mks-border, rgba(255,255,255,0.12))',
  },
  error: {
    bg: 'color-mix(in srgb, var(--mks-neg, var(--red-light)) 14%, transparent)',
    border: 'color-mix(in srgb, var(--mks-neg, var(--red-light)) 45%, var(--mks-border, transparent) 55%)',
    color: 'var(--mks-neg, var(--red-light))',
    rail: 'color-mix(in srgb, var(--mks-neg, var(--red-light)) 72%, transparent)',
  },
};

export function SessionCard({ session }: { session: Session }) {
  const liveMetrics = useDxdMetricsStore((s) => s.liveMetrics[session.session_id]);

  const totalPnl = liveMetrics ? Object.values(liveMetrics).reduce((sum, m) => sum + m.pnl, 0) : null;

  const startedAt = new Date(session.started_at).toLocaleString();
  const st = statusStyles[session.status] ?? statusStyles.stopped;

  return (
    <Link
      href={`/dashboard/sessions/${session.session_id}`}
      className="card-interactive dash-session-card"
      style={{
        display: 'block',
        position: 'relative',
        padding: '26px 26px 26px 22px',
        textDecoration: 'none',
        transition: 'all var(--duration-normal) var(--ease-out)',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: st.rail,
          opacity: 0.85,
        }}
      />

      <div style={{ paddingLeft: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
            <span className="dash-session-chip" style={{ borderStyle: 'dashed' }}>
              {(session.strategy ?? 'maker').toUpperCase()}
            </span>
            {session.symbols.map((sym) => (
              <span key={sym} className="dash-session-chip">
                {sym}
              </span>
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ui), var(--font-sans), system-ui, sans-serif',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              color: st.color,
              background: st.bg,
              border: `1px solid ${st.border}`,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              flexShrink: 0,
            }}
          >
            {session.status}
          </span>
        </div>

        {totalPnl !== null && (
          <div style={{ marginBottom: 18 }}>
            <p
              style={{
                fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: 'var(--tracking-label)',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Session PnL
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                fontStyle: 'italic',
                fontWeight: 500,
                lineHeight: 1.05,
                color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                margin: 0,
              }}
            >
              {totalPnl >= 0 ? '+' : ''}
              {totalPnl.toFixed(2)}{' '}
              <span style={{ fontSize: '0.55em', color: 'var(--text-secondary)', fontWeight: 600 }}>USD</span>
            </p>
          </div>
        )}

        <div className="dash-session-divider" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p
            style={{
              fontFamily: 'var(--font-ui), var(--font-sans), sans-serif',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.02em',
              margin: 0,
            }}
          >
            Started <time dateTime={session.started_at}>{startedAt}</time>
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            {session.session_id.slice(0, 10)}… · Agent {session.agent_address.slice(0, 6)}…{session.agent_address.slice(-4)}
          </p>
        </div>
      </div>
    </Link>
  );
}
