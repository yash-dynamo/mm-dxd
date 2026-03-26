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

function cls(n: number) {
  return n >= 0 ? 'mks-pos' : 'mks-neg';
}

function chip(ok: boolean) {
  return ok ? 'mks-chip mks-chip-ok' : 'mks-chip mks-chip-bad';
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
  const volHeat = seriesForSymbol(historyRows, symbol, 'vol_bps', 40);
  const spreadHeat = seriesForSymbol(historyRows, symbol, 'spread_bps', 40);

  return (
    <article className="mks-card mks-symbol-card">
      <div className="mks-row mks-symbol-head">
        <div className="mks-symbol-title">
          <span className="mks-mono">{symbol}</span>
          <span className="mks-badge">{m.inv_tier != null ? `tier ${m.inv_tier}` : '—'}</span>
          {m.guard_halted ? (
            <span className="mks-badge mks-mono" style={{ color: 'var(--mks-neg)' }}>
              HALTED
            </span>
          ) : (
            <span className="mks-badge mks-mono">live</span>
          )}
        </div>
        <div className="mks-row">
          <span className="mks-badge mks-mono">α {fmt(m.alpha, 3)}</span>
          <span className="mks-badge mks-mono">toxic {fmt(m.toxic, 3)}</span>
        </div>
      </div>

      <div className="mks-mini-grid">
        <div className="mks-mini">
          <div className="mks-k">PnL</div>
          <div className={`mks-v ${cls(m.pnl)}`}>${fmt(m.pnl)}</div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">Inventory</div>
          <div className="mks-v mks-mono">{fmt(m.inventory, 4)}</div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">Spread</div>
          <div className="mks-v mks-mono">{fmt(m.spread_bps, 2)} bps</div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">Volatility</div>
          <div className="mks-v mks-mono">{fmt(m.vol_bps, 2)} bps</div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">Fills / Vol</div>
          <div className="mks-v mks-mono">
            {m.total_fills} / ${fmt(m.total_volume_usd, 0)}
          </div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">Round trips</div>
          <div className="mks-v mks-mono">{m.round_trips}</div>
        </div>
        <div className="mks-mini">
          <div className="mks-k">BN / HS / Fair</div>
          <div className="mks-v mks-mono">
            {fmt(m.bn_mid, 4)} / {fmt(m.hs_mid, 4)} / {fmt(m.fair_mid, 4)}
          </div>
        </div>
      </div>

      <div className="mks-chips">
        <span className={chip(!m.guard_halted)}>guard</span>
        <span className={chip(m.guard_spread_mult <= 1.01)}>spread cap</span>
        <span className={chip(m.spread_bps > 0)}>spread&gt;0</span>
        <span className={chip(m.adverse_rate < 0.5)}>adverse</span>
        <span className={chip(m.toxic < 0.5)}>toxic</span>
        <span className={chip(m.total_fills > 0)}>fills</span>
      </div>

      <div className="mks-split">
        <div className="mks-panel">
          <div className="mks-muted mks-small">Fair mid (history)</div>
          <DxdSparkline points={fairHistory} />
          <div className="mks-muted mks-small mks-mono">
            fair {fmt(m.fair_mid, 4)} | HS {fmt(m.hs_mid, 4)} | BN {fmt(m.bn_mid, 4)}
          </div>
        </div>
        <div className="mks-panel">
          <div className="mks-muted mks-small">Markouts</div>
          <div className="mks-line">
            <span>1s</span>
            <span className="mks-mono">{fmt(m.avg_markout_1s, 4)}</span>
          </div>
          <div className="mks-line">
            <span>5s</span>
            <span className="mks-mono">{fmt(m.avg_markout_5s, 4)}</span>
          </div>
          <div className="mks-line">
            <span>Adverse %</span>
            <span className={`mks-mono ${cls(-m.adverse_rate)}`}>{fmt(m.adverse_rate * 100, 1)}%</span>
          </div>
          <div className="mks-line">
            <span>Equity</span>
            <span className="mks-mono" style={{ color: 'var(--gold)' }}>
              ${fmt(m.account_equity, 2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mks-split">
        <div className="mks-panel">
          <div className="mks-muted mks-tiny">Volatility heat (history)</div>
          <DxdHeatStrip values={volHeat} min={0} max={Math.max(0.5, m.vol_bps * 2)} />
          <div className="mks-muted mks-tiny">Spread heat (history)</div>
          <DxdHeatStrip values={spreadHeat} min={0} max={Math.max(0.05, m.spread_bps * 3)} />
        </div>
        <div className="mks-panel">
          <div className="mks-muted mks-small">Guards</div>
          <div className="mks-line">
            <span>Interventions</span>
            <span className="mks-mono">{m.guard_interventions}</span>
          </div>
          <div className="mks-line">
            <span>Spread mult</span>
            <span className="mks-mono">{fmt(m.guard_spread_mult, 2)}×</span>
          </div>
          <div className="mks-muted mks-tiny">Markout 5s trend</div>
          <DxdSparkline points={seriesForSymbol(historyRows, symbol, 'avg_markout_5s', 48)} />
        </div>
      </div>
    </article>
  );
}

export function MetricsPanel({ metrics, isRestarting, historyRows = [] }: MetricsPanelProps) {
  return (
    <div className="mks-metrics-stack">
      {isRestarting && (
        <div className="mks-restart-banner">
          <Spin /> Strategy restarting after config change (~2–3s)
        </div>
      )}
      {Object.entries(metrics).map(([symbol, m]) => (
        <SymbolCard key={symbol} symbol={symbol} m={m} historyRows={historyRows} />
      ))}
    </div>
  );
}
