'use client';

import { useState } from 'react';
import { HistoryRow } from '@/stores/slices/dxd/metrics';

interface MetricsChartProps {
  rows: HistoryRow[];
  symbol?: string;
}

interface HoverPoint {
  symbol: string;
  ts: string;
  pnl: number;
  x: number;
  y: number;
}

const rawColors = ['#cc3333', '#c9a227', '#00c864', '#2a5aaa', '#7b00c8', '#cc4400'];

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

function fmtSignedUsd(n: number, d = 2) {
  return `${n < 0 ? '-' : '+'}$${Math.abs(n).toFixed(d)}`;
}

function fmtTs(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MetricsChart({ rows, symbol }: MetricsChartProps) {
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);
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
      <div className="dxd-history-chart dxd-history-chart--empty">
        <p className="dxd-history-chart-title">PnL over time</p>
        <p className="dxd-history-chart-empty-msg">No history data yet</p>
      </div>
    );
  }

  const allPnl = filtered.map((r) => r.pnl);
  const minPnl = Math.min(...allPnl);
  const maxPnl = Math.max(...allPnl);
  const midPnl = (minPnl + maxPnl) / 2;
  const range = maxPnl - minPnl || 1;
  const sortedByTs = [...filtered].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const firstTs = sortedByTs[0]?.ts ?? '';
  const midTs = sortedByTs[Math.floor((sortedByTs.length - 1) / 2)]?.ts ?? '';
  const lastTs = sortedByTs[sortedByTs.length - 1]?.ts ?? '';

  const W = 760;
  const H = 274;
  const PAD_LEFT = 58;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 36;
  const CHART_W = W - PAD_LEFT - PAD_RIGHT;
  const CHART_H = H - PAD_TOP - PAD_BOTTOM;
  const X_TICK_Y = H - 14;
  const X_TITLE_Y = H - 2;

  const yFor = (v: number) => PAD_TOP + ((maxPnl - v) / range) * CHART_H;

  function buildSeriesPoints(symRows: HistoryRow[], sym: string): HoverPoint[] {
    const total = symRows.length;
    return symRows.map((r, i) => ({
      symbol: sym,
      ts: r.ts,
      pnl: r.pnl,
      x: PAD_LEFT + (i / (total - 1 || 1)) * CHART_W,
      y: yFor(r.pnl),
    }));
  }

  function buildPath(points: HoverPoint[]): string {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
  }

  const zeroY = yFor(0);
  const series = symbols.map((sym, idx) => {
    const points = buildSeriesPoints(bySymbol[sym], sym);
    return {
      symbol: sym,
      color: rawColors[idx % rawColors.length],
      points,
      path: buildPath(points),
    };
  });

  const tooltipText = hoverPoint
    ? `${hoverPoint.symbol}  ${fmtSignedUsd(hoverPoint.pnl, 2)}  ${fmtTs(hoverPoint.ts)}`
    : '';
  const tooltipWidth = Math.min(236, 18 + tooltipText.length * 6.2);
  const tooltipHeight = 20;
  const tooltipX = hoverPoint
    ? hoverPoint.x > W - tooltipWidth - 10
      ? hoverPoint.x - tooltipWidth - 10
      : hoverPoint.x + 10
    : 0;
  const tooltipY = hoverPoint ? Math.max(PAD_TOP + 2, hoverPoint.y - 20) : 0;

  return (
    <div className="dxd-history-chart">
      <p className="dxd-history-chart-title">PnL over time</p>
      <div className="dxd-history-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="dxd-history-chart-svg" preserveAspectRatio="xMidYMid meet">
          <line className="dxd-chart-axis-line" x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={H - PAD_BOTTOM} />
          <line className="dxd-chart-axis-line" x1={PAD_LEFT} y1={H - PAD_BOTTOM} x2={W - PAD_RIGHT} y2={H - PAD_BOTTOM} />

          {[maxPnl, midPnl, minPnl].map((v) => {
            const y = yFor(v);
            return (
              <g key={v}>
                <line className="dxd-chart-grid-line" x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} />
                <line className="dxd-chart-axis-tick" x1={PAD_LEFT - 4} y1={y} x2={PAD_LEFT} y2={y} />
                <text className="dxd-chart-axis-label" x={PAD_LEFT - 8} y={y + 3} textAnchor="end">
                  {fmt(v, 2)}
                </text>
              </g>
            );
          })}

          {zeroY >= PAD_TOP && zeroY <= H - PAD_BOTTOM && (
            <line
              className="dxd-chart-zero-line"
              x1={PAD_LEFT}
              y1={zeroY}
              x2={W - PAD_RIGHT}
              y2={zeroY}
              strokeDasharray="4 4"
            />
          )}

          {series.map((s) => (
            <g key={s.symbol}>
              <path
                d={s.path}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {s.points.map((p, idx) => (
                <circle
                  key={`${s.symbol}-${p.ts}-${idx}`}
                  className="dxd-chart-hover-target"
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  onMouseEnter={() => setHoverPoint(p)}
                  onMouseLeave={() =>
                    setHoverPoint((cur) =>
                      cur && cur.symbol === p.symbol && cur.ts === p.ts ? null : cur,
                    )
                  }
                />
              ))}
            </g>
          ))}

          {hoverPoint && (
            <g pointerEvents="none">
              <circle className="dxd-chart-hover-dot" cx={hoverPoint.x} cy={hoverPoint.y} r={3.6} />
              <rect
                className="dxd-chart-tooltip-bg"
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx={6}
              />
              <text className="dxd-chart-tooltip-text dxd-mono" x={tooltipX + 8} y={tooltipY + 13.5}>
                {tooltipText}
              </text>
            </g>
          )}

          <text className="dxd-chart-axis-label" x={PAD_LEFT} y={X_TICK_Y} textAnchor="start">
            {fmtTs(firstTs)}
          </text>
          <text
            className="dxd-chart-axis-label dxd-chart-axis-label--mid-x"
            x={PAD_LEFT + CHART_W / 2}
            y={X_TICK_Y}
            textAnchor="middle"
          >
            {fmtTs(midTs)}
          </text>
          <text className="dxd-chart-axis-label" x={W - PAD_RIGHT} y={X_TICK_Y} textAnchor="end">
            {fmtTs(lastTs)}
          </text>

          <text className="dxd-chart-axis-title" x={PAD_LEFT + CHART_W / 2} y={X_TITLE_Y} textAnchor="middle">
            Time
          </text>
          <text
            className="dxd-chart-axis-title"
            x={14}
            y={PAD_TOP + CHART_H / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${PAD_TOP + CHART_H / 2})`}
          >
            PnL (USD)
          </text>
        </svg>
      </div>

      {symbols.length > 1 && (
        <div className="dxd-history-chart-legend">
          {symbols.map((sym, idx) => (
            <div key={sym} className="dxd-history-chart-legend-item">
              <span className="dxd-history-chart-swatch" style={{ background: rawColors[idx % rawColors.length] }} />
              <span className="dxd-history-chart-legend-label">{sym}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
