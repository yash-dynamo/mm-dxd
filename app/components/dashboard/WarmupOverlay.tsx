'use client';

export function WarmupOverlay() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 0',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <svg className="animate-spin" width={32} height={32} viewBox="0 0 24 24" fill="none" style={{ color: 'var(--red)', marginBottom: 16 }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-3xl)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
        Warming up…
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 6 }}>
        Metrics will be available in 10–30 seconds after session start.
      </p>
    </div>
  );
}
