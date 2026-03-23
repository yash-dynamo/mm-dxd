'use client';

import { useDxdAuth, DxdAuthStatus } from '@/hooks/dxd';

const statusLabels: Record<DxdAuthStatus, string> = {
  idle: 'SIGN IN',
  'requesting-nonce': 'REQUESTING NONCE…',
  signing: 'APPROVE IN WALLET…',
  verifying: 'VERIFYING SIGNATURE…',
  done: 'SIGNED IN',
  error: 'RETRY SIGN IN',
};

const statusDescriptions: Record<DxdAuthStatus, string> = {
  idle: 'Sign a message with your wallet to authenticate. No gas fees.',
  'requesting-nonce': 'Fetching a one-time nonce from the DXD server…',
  signing: 'Your wallet should pop up — sign the message to prove ownership.',
  verifying: 'Sending your signature to the server for verification…',
  done: 'Authentication complete.',
  error: 'Something went wrong. You can try again.',
};

const Spin = () => (
  <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function SignInStep() {
  const { signIn, status, error, walletAddress } = useDxdAuth();
  const isLoading = status === 'requesting-nonce' || status === 'signing' || status === 'verifying';

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-red-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(204,51,51,0.08)',
            border: '1px solid var(--border-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'var(--text-7xl)',
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: 'var(--tracking-normal)',
          }}
        >
          Sign In
        </h1>

        {/* Connected wallet badge */}
        {walletAddress && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '5px 12px',
              marginBottom: 20,
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 'var(--radius-full)',
                background: 'var(--green)',
                boxShadow: '0 0 6px var(--green)',
              }}
            />
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </div>
        )}

        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 24,
          }}
        >
          {statusDescriptions[status]}
        </p>

        {/* Step indicators */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {(['requesting-nonce', 'signing', 'verifying'] as const).map((step, i) => {
            const stepOrder = ['requesting-nonce', 'signing', 'verifying'];
            const currentIdx = stepOrder.indexOf(status);
            const thisIdx = i;
            const isDone = status === 'done' || (currentIdx > thisIdx);
            const isActive = status === step;

            return (
              <div
                key={step}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-full)',
                  background: isDone
                    ? 'var(--green)'
                    : isActive
                      ? 'var(--red)'
                      : 'var(--border-subtle)',
                  transition: 'all var(--duration-normal) var(--ease-out)',
                  boxShadow: isActive ? 'var(--shadow-glow-red)' : 'none',
                }}
              />
            );
          })}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid var(--border-red-medium)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--red-light)',
              marginBottom: 16,
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={() => signIn()}
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: '100%', opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading && <Spin />}
          {statusLabels[status]}
        </button>

        <p
          style={{
            marginTop: 16,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          EIP-191 personal_sign — no gas, no cost.
        </p>
      </div>
    </div>
  );
}
