'use client';

export function WarmupOverlay() {
  return (
    <div className="mks-warmup">
      <svg className="mks-warmup-spinner animate-spin" width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="mks-warmup-title">Warming up…</p>
      <p className="mks-warmup-sub">Metrics will be available in 10–30 seconds after session start.</p>
    </div>
  );
}
