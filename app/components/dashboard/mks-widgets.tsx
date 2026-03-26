'use client';

import { useMemo } from 'react';

function cleanSeries(values: Array<number | null | undefined>): number[] {
  return values
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((v) => Number.isFinite(v));
}

export function MksSparkline({ points, className = '' }: { points: Array<number | null | undefined>; className?: string }) {
  const clean = useMemo(() => cleanSeries(points), [points]);
  if (clean.length < 2) {
    return (
      <svg viewBox="0 0 240 72" className={`mks-spark ${className}`} preserveAspectRatio="none">
        <line x1="0" y1="36" x2="240" y2="36" className="mks-grid-line" />
      </svg>
    );
  }

  const w = 240;
  const h = 72;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = Math.max(1e-9, max - min);
  const step = w / (clean.length - 1);

  const d = clean
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / span) * (h - 6) - 3;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 240 72" className={`mks-spark ${className}`} preserveAspectRatio="none">
      <line x1="0" y1="36" x2="240" y2="36" className="mks-grid-line" />
      <path d={d} className="mks-spark-line" />
    </svg>
  );
}

function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function MksHeatStrip({
  values,
  min = 0,
  max = 1,
  className = '',
}: {
  values: Array<number | null | undefined>;
  min?: number;
  max?: number;
  className?: string;
}) {
  const safeMax = Math.max(min + 1e-9, max);

  return (
    <div className={`mks-heat-strip ${className}`}>
      {values.map((v, idx) => {
        const n = v == null ? NaN : asNumber(v, NaN);
        const t = Number.isFinite(n) ? Math.min(1, Math.max(0, (n - min) / (safeMax - min))) : 0;
        const hue = 210 - 210 * t;
        const alpha = 0.2 + 0.65 * t;
        return <span key={idx} className="mks-heat-cell" style={{ background: `hsla(${hue}, 95%, 60%, ${alpha})` }} />;
      })}
    </div>
  );
}
