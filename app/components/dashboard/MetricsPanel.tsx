'use client';

import { SymbolMetrics } from '@/lib/dxd-api';

interface MetricsPanelProps {
  metrics: Record<string, SymbolMetrics>;
  isRestarting?: boolean;
}

const Spin = () => (
  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'gold' | 'none';
}) {
  const colors = {
    green: 'var(--green)',
    red: 'var(--red-light)',
    gold: 'var(--gold)',
    none: 'var(--text-primary)',
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 14,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-2xs)',
          color: 'var(--text-dim)',
          letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--text-4xl)',
          fontStyle: 'italic',
          fontWeight: 500,
          color: colors[accent ?? 'none'],
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xs)', color: 'var(--text-ghost)', marginTop: 2 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SymbolMetricsBlock({ symbol, m }: { symbol: string; m: SymbolMetrics }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span
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
          {symbol}
        </span>
        {m.guard_halted && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-2xs)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-label)',
              color: 'var(--red)',
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid var(--border-red-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
            }}
          >
            HALTED
          </span>
        )}
        {m.guard_spread_mult > 1 && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-2xs)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-label)',
              color: 'var(--gold)',
              background: 'rgba(201,162,39,0.06)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
            }}
          >
            SPREAD ×{m.guard_spread_mult.toFixed(1)}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        <StatCard label="PnL" value={`${m.pnl >= 0 ? '+' : ''}${m.pnl.toFixed(2)}`} accent={m.pnl > 0 ? 'green' : m.pnl < 0 ? 'red' : 'none'} />
        <StatCard label="Inventory" value={m.inventory.toFixed(4)} sub={`Tier ${m.inv_tier}`} />
        <StatCard label="Spread" value={`${m.spread_bps.toFixed(2)} bps`} />
        <StatCard label="Volatility" value={`${m.vol_bps.toFixed(2)} bps`} />
        <StatCard label="Fills" value={String(m.total_fills)} />
        <StatCard label="Volume" value={`$${m.total_volume_usd.toFixed(0)}`} />
        <StatCard label="Round Trips" value={String(m.round_trips)} />
        <StatCard label="Alpha" value={m.alpha.toFixed(3)} />
        <StatCard label="Toxic Flow" value={m.toxic.toFixed(3)} accent={m.toxic > 0.7 ? 'red' : 'none'} />
        <StatCard label="Adverse Rate" value={`${(m.adverse_rate * 100).toFixed(1)}%`} />
        <StatCard label="Markout 1s" value={`${m.avg_markout_1s.toFixed(3)}`} />
        <StatCard label="Markout 5s" value={`${m.avg_markout_5s.toFixed(3)}`} />
        <StatCard label="Equity" value={`$${m.account_equity.toFixed(2)}`} accent="gold" />
        <StatCard label="Fair Mid" value={m.fair_mid.toFixed(4)} />
        <StatCard label="HS Mid" value={m.hs_mid.toFixed(4)} />
        <StatCard label="BN Mid" value={m.bn_mid.toFixed(4)} />
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics, isRestarting }: MetricsPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {isRestarting && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(201,162,39,0.06)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--gold)',
          }}
        >
          <Spin /> Strategy restarting after config change (~2-3s)
        </div>
      )}
      {Object.entries(metrics).map(([symbol, m]) => (
        <SymbolMetricsBlock key={symbol} symbol={symbol} m={m} />
      ))}
    </div>
  );
}
