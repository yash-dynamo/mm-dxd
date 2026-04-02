'use client';

import type { SymbolMetrics } from '@/lib/dxd-api';
import type { HistoryRow } from '@/stores/slices/dxd/metrics';
import { DxdHeatStrip, DxdSparkline } from './dxd-widgets';

interface MetricsPanelProps {
  metrics: Record<string, SymbolMetrics>;
  isRestarting?: boolean;
  historyRows?: HistoryRow[];
}

const Spin = () => (
  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function fmt(n: number, d = 2) {
  return n.toFixed(d);
}

function fmtSignedUsd(n: number, d = 2) {
  return `${n < 0 ? '-' : '+'}$${Math.abs(n).toFixed(d)}`;
}

function cls(n: number) {
  return n >= 0 ? 'dxd-pos' : 'dxd-neg';
}

function seriesForSymbol(rows: HistoryRow[], symbol: string, pick: keyof SymbolMetrics, limit = 48) {
  return rows
    .filter((r) => r.symbol === symbol)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .slice(-limit)
    .map((r) => r[pick] as number);
}

function SymbolCard({
  symbol,
  m,
  historyRows,
}: {
  symbol: string;
  m: SymbolMetrics;
  historyRows: HistoryRow[];
}) {
  const fairHistory = seriesForSymbol(historyRows, symbol, 'fair_mid', 64);
  const fairMin = fairHistory.length > 0 ? Math.min(...fairHistory) : m.fair_mid;
  const fairMax = fairHistory.length > 0 ? Math.max(...fairHistory) : m.fair_mid;
  const fairMidAxis = (fairMin + fairMax) / 2;
  const volHeat = seriesForSymbol(historyRows, symbol, 'vol_bps', 40);
  const spreadHeat = seriesForSymbol(historyRows, symbol, 'spread_bps', 40);

  return (
    <article className="dxd-card dxd-symbol-card">
      <div className="dxd-row dxd-symbol-head">
        <div className="dxd-symbol-title">
          <span className="dxd-mono">{symbol}</span>
          <span className="dxd-badge">{m.inv_tier != null ? `tier ${m.inv_tier}` : '—'}</span>
          {m.guard_halted ? (
            <span className="dxd-badge dxd-mono" style={{ color: 'var(--dxd-neg)' }}>
              HALTED
            </span>
          ) : (
            <span className="dxd-badge dxd-mono">live</span>
          )}
        </div>
        <div className="dxd-row">
          <span className="dxd-badge dxd-mono">α {fmt(m.alpha, 3)}</span>
          <span className="dxd-badge dxd-mono">toxic {fmt(m.toxic, 3)}</span>
        </div>
      </div>

      <div className="dxd-mini-grid">
        <div className="dxd-mini">
          <div className="dxd-k">PnL</div>
          <div className={`dxd-v ${cls(m.pnl)}`}>{fmtSignedUsd(m.pnl)}</div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">Inventory</div>
          <div className="dxd-v dxd-mono">{fmt(m.inventory, 4)}</div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">Spread</div>
          <div className="dxd-v dxd-mono">{fmt(m.spread_bps, 2)} bps</div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">Volatility</div>
          <div className="dxd-v dxd-mono">{fmt(m.vol_bps, 2)} bps</div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">Fills / Vol</div>
          <div className="dxd-v dxd-mono">
            {m.total_fills} / ${fmt(m.total_volume_usd, 0)}
          </div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">Round trips</div>
          <div className="dxd-v dxd-mono">{m.round_trips}</div>
        </div>
        <div className="dxd-mini">
          <div className="dxd-k">BN / HS / Fair</div>
          <div className="dxd-v dxd-mono">
            {fmt(m.bn_mid, 2)} / {fmt(m.hs_mid, 2)} / {fmt(m.fair_mid, 2)}
          </div>
        </div>
      </div>

      <div className="dxd-split">
        <div className="dxd-panel">
          <div className="dxd-muted dxd-small">Fair mid (history)</div>
          <div className="dxd-spark-with-axis">
            <div className="dxd-spark-y-axis dxd-mono" aria-hidden="true">
              <span>{fmt(fairMax, 2)}</span>
              <span>{fmt(fairMidAxis, 2)}</span>
              <span>{fmt(fairMin, 2)}</span>
            </div>
            <DxdSparkline points={fairHistory} className="dxd-spark-axis-chart" />
          </div>
        </div>
        <div className="dxd-panel">
          <div className="dxd-muted dxd-small">Markouts</div>
          <div className="dxd-line">
            <span>1s</span>
            <span className="dxd-mono">{fmt(m.avg_markout_1s, 4)}</span>
          </div>
          <div className="dxd-line">
            <span>5s</span>
            <span className="dxd-mono">{fmt(m.avg_markout_5s, 4)}</span>
          </div>
          <div className="dxd-line">
            <span>Adverse %</span>
            <span className={`dxd-mono ${cls(-m.adverse_rate)}`}>{fmt(m.adverse_rate * 100, 1)}%</span>
          </div>
          <div className="dxd-line">
            <span>Equity</span>
            <span className="dxd-mono" style={{ color: 'var(--red-light)' }}>
              ${fmt(m.account_equity, 2)}
            </span>
          </div>
        </div>
      </div>

      <div className="dxd-split">
        <div className="dxd-panel">
          <div className="dxd-muted dxd-tiny">Volatility heat (history)</div>
          <DxdHeatStrip values={volHeat} min={0} max={Math.max(0.5, m.vol_bps * 2)} />
          <div className="dxd-muted dxd-tiny">Spread heat (history)</div>
          <DxdHeatStrip values={spreadHeat} min={0} max={Math.max(0.05, m.spread_bps * 3)} />
        </div>
        <div className="dxd-panel">
          <div className="dxd-muted dxd-small">Guards</div>
          <div className="dxd-line">
            <span>Interventions</span>
            <span className="dxd-mono">{m.guard_interventions}</span>
          </div>
          <div className="dxd-line">
            <span>Spread mult</span>
            <span className="dxd-mono">{fmt(m.guard_spread_mult, 2)}×</span>
          </div>
          <div className="dxd-muted dxd-tiny">Markout 5s trend</div>
          <DxdSparkline points={seriesForSymbol(historyRows, symbol, 'avg_markout_5s', 48)} />
        </div>
      </div>
    </article>
  );
}

export function MetricsPanel({ metrics, isRestarting, historyRows = [] }: MetricsPanelProps) {
  return (
    <div className="dxd-metrics-stack">
      {isRestarting && (
        <div className="dxd-restart-banner">
          <Spin /> Strategy restarting after config change (~2–3s)
        </div>
      )}
      {Object.entries(metrics).map(([symbol, m]) => (
        <SymbolCard key={symbol} symbol={symbol} m={m} historyRows={historyRows} />
      ))}
    </div>
  );
}
