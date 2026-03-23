'use client';

import { HistoryRow } from '@/stores/slices/dxd/metrics';

interface MetricsChartProps {
  rows: HistoryRow[];
  symbol?: string;
}

export function MetricsChart({ rows, symbol }: MetricsChartProps) {
  const filtered = symbol ? rows.filter((r) => r.symbol === symbol) : rows;

  const bySymbol: Record<string, HistoryRow[]> = {};
  for (const row of filtered) {
    if (!bySymbol[row.symbol]) bySymbol[row.symbol] = [];
    bySymbol[row.symbol].push(row);
  }
  for (const sym of Object.keys(bySymbol)) {
    bySymbol[sym].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }

  const symbols = Object.keys(bySymbol);

  if (symbols.length === 0 || filtered.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 0',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-dim)',
        }}
      >
        No history data yet
      </div>
    );
  }

  const allPnl = filtered.map((r) => r.pnl);
  const minPnl = Math.min(...allPnl);
  const maxPnl = Math.max(...allPnl);
  const range = maxPnl - minPnl || 1;

  const W = 600;
  const H = 160;
  const PAD = 10;

  const colors = ['var(--red)', 'var(--gold)', 'var(--green)', 'var(--blue)', 'var(--purple)', 'var(--orange)'];
  const rawColors = ['#cc3333', '#c9a227', '#00c864', '#2a5aaa', '#7b00c8', '#cc4400'];

  function buildPath(symRows: HistoryRow[]): string {
    const total = symRows.length;
    return symRows
      .map((r, i) => {
        const x = PAD + (i / (total - 1 || 1)) * (W - PAD * 2);
        const y = H - PAD - ((r.pnl - minPnl) / range) * (H - PAD * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const zeroY = H - PAD - ((0 - minPnl) / range) * (H - PAD * 2);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
          letterSpacing: 'var(--tracking-label)',
          marginBottom: 14,
        }}
      >
        PNL OVER TIME
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} preserveAspectRatio="none">
        {zeroY >= PAD && zeroY <= H - PAD && (
          <line
            x1={PAD}
            y1={zeroY}
            x2={W - PAD}
            y2={zeroY}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
        )}
        {symbols.map((sym, idx) => (
          <path
            key={sym}
            d={buildPath(bySymbol[sym])}
            fill="none"
            stroke={rawColors[idx % rawColors.length]}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {symbols.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14 }}>
          {symbols.map((sym, idx) => (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 16,
                  height: 3,
                  borderRadius: 2,
                  background: rawColors[idx % rawColors.length],
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--text-dim)',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                {sym}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
