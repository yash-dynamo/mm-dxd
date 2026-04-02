'use client';

import Link from 'next/link';
import { Session } from '@/lib/dxd-api';
import { useDxdMetricsStore } from '@/stores';

const STATUS_CONFIG: Record<string, { color: string; pulse: boolean; label: string }> = {
  running:  { color: 'var(--green)',      pulse: true,  label: 'Running'  },
  starting: { color: 'var(--red-light)',  pulse: true,  label: 'Starting' },
  stopped:  { color: 'var(--text-ghost)', pulse: false, label: 'Stopped'  },
  error:    { color: 'var(--red)',        pulse: false, label: 'Error'    },
};

const RIBBON_CONFIG: Record<string, { bg: string; text: string }> = {
  maker: { bg: 'var(--red)',   text: '#fff'  },
  taker: { bg: 'var(--green)', text: '#000'  },
};

function fmtSignedUsd(n: number, d = 2) {
  const sign = n < 0 ? '−' : '+';
  return `${sign}$${Math.abs(n).toFixed(d)}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SessionCard({ session }: { session: Session }) {
  const liveMetrics = useDxdMetricsStore((s) => s.liveMetrics[session.session_id]);
  const totalPnl = liveMetrics
    ? Object.values(liveMetrics).reduce((sum, m) => sum + m.pnl, 0)
    : null;

  const sc = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.stopped;
  const rb = RIBBON_CONFIG[session.strategy ?? 'maker'];
  const isAlive = session.status === 'running' || session.status === 'starting';
  const symbolCount = session.symbols.length;

  return (
    <Link
      href={`/dashboard/sessions/${session.session_id}`}
      className="dash-scard"
      aria-label={`${session.strategy ?? 'maker'} session — ${sc.label}`}
    >
      {/* ── Corner ribbon: maker / taker ── */}
      <span
        className="dash-scard__ribbon"
        style={{ '--rb-bg': rb.bg, '--rb-text': rb.text } as React.CSSProperties}
        aria-hidden
      >
        <span className="dash-scard__ribbon-inner">
          {(session.strategy ?? 'maker').toUpperCase()}
        </span>
      </span>

      {/* ── Status rail (bottom edge) ── */}
      <span className="dash-scard__rail" style={{ background: sc.color }} aria-hidden />

      <div className="dash-scard__body">

        {/* ─ Symbols ─ */}
        <div className="dash-scard__symbols">
          {session.symbols.slice(0, 4).map((sym) => (
            <span key={sym} className="dash-scard__sym">{sym}</span>
          ))}
          {symbolCount > 4 && (
            <span className="dash-scard__sym dash-scard__sym--more">+{symbolCount - 4}</span>
          )}
        </div>

        {/* ─ PnL ─ */}
        <div className="dash-scard__pnl-block">
          <p className="dash-scard__pnl-label">Session PnL</p>
          {totalPnl !== null ? (
            <p
              className="dash-scard__pnl-value"
              style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {fmtSignedUsd(totalPnl)}
              <span className="dash-scard__pnl-unit">USD</span>
            </p>
          ) : (
            <p className="dash-scard__pnl-value dash-scard__pnl-value--empty">—</p>
          )}
        </div>

        {/* ─ Footer ─ */}
        <div className="dash-scard__footer">
          {/* Status */}
          <div className="dash-scard__status">
            {sc.pulse && (
              <span
                className="dash-scard__pulse"
                style={{ '--pulse-color': sc.color } as React.CSSProperties}
                aria-hidden
              />
            )}
            <span className="dash-scard__status-dot" style={{ background: sc.color }} aria-hidden />
            <span className="dash-scard__status-text" style={{ color: sc.color }}>{sc.label}</span>
          </div>

          {/* Time + live badge */}
          <div className="dash-scard__footer-right">
            {isAlive && <span className="dash-scard__live-badge">LIVE</span>}
            <span className="dash-scard__time">{relativeTime(session.started_at)}</span>
          </div>
        </div>

        {/* ─ ID row ─ */}
        <div className="dash-scard__id-row">
          <span className="dash-scard__id">#{session.session_id.slice(0, 12)}</span>
          <svg
            className="dash-scard__arrow-icon"
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

      </div>
    </Link>
  );
}
