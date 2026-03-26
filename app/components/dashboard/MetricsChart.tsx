'use client';

import { HistoryRow } from '@/stores/slices/dxd/metrics';

interface MetricsChartProps {
  rows: HistoryRow[];
  symbol?: string;
}

const rawColors = ['#cc3333', '#c9a227', '#00c864', '#2a5aaa', '#7b00c8', '#cc4400'];

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
      <div className="mks-history-chart mks-history-chart--empty">
        <p className="mks-history-chart-title">PnL over time</p>
        <p className="mks-history-chart-empty-msg">No history data yet</p>
      </div>
    );
  }

  const allPnl = filtered.map((r) => r.pnl);
  const minPnl = Math.min(...allPnl);
  const maxPnl = Math.max(...allPnl);
  const range = maxPnl - minPnl || 1;

  const W = 720;
  const H = 260;
  const PAD = 12;

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
    <div className="mks-history-chart">
      <p className="mks-history-chart-title">PnL over time</p>
      <div className="mks-history-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="mks-history-chart-svg" preserveAspectRatio="xMidYMid meet">
          {zeroY >= PAD && zeroY <= H - PAD && (
            <line
              className="mks-chart-zero-line"
              x1={PAD}
              y1={zeroY}
              x2={W - PAD}
              y2={zeroY}
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
      </div>

      {symbols.length > 1 && (
        <div className="mks-history-chart-legend">
          {symbols.map((sym, idx) => (
            <div key={sym} className="mks-history-chart-legend-item">
              <span className="mks-history-chart-swatch" style={{ background: rawColors[idx % rawColors.length] }} />
              <span className="mks-history-chart-legend-label">{sym}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
