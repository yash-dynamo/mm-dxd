'use client';

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  return (
    <main
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        gap: '16px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      {reset && (
        <button
          onClick={reset}
          style={{
            marginTop: '8px',
            padding: '10px 28px',
            backgroundColor: '#93ea5d',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '100px',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </main>
  );
}
