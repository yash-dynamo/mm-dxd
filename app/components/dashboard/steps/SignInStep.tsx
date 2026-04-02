'use client';

import { useDxdAuth, DxdAuthStatus } from '@/hooks/dxd';

const STEPS: DxdAuthStatus[] = ['requesting-nonce', 'signing', 'verifying'];

const STATUS_LABEL: Record<DxdAuthStatus, string> = {
  idle: 'SIGN IN',
  'requesting-nonce': 'REQUESTING NONCE…',
  signing: 'SIGN IN WALLET…',
  verifying: 'VERIFYING…',
  done: 'SIGNED IN',
  error: 'RETRY',
};

const STATUS_DESC: Record<DxdAuthStatus, string> = {
  idle: 'Sign a message to authenticate. No gas fees.',
  'requesting-nonce': 'Fetching a one-time nonce…',
  signing: 'Sign the message in your wallet to prove ownership.',
  verifying: 'Verifying your signature…',
  done: 'Authenticated.',
  error: 'Something went wrong. Try again.',
};

const Spin = () => (
  <svg className="animate-spin" width={13} height={13} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function SignInStep() {
  const { signIn, status, error, walletAddress } = useDxdAuth();
  const isLoading = status === 'requesting-nonce' || status === 'signing' || status === 'verifying';
  const currentStep = STEPS.indexOf(status);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
    }}>
      {/* Background watermark */}
      <div aria-hidden style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(200px, 30vw, 360px)',
        fontWeight: 700,
        fontStyle: 'italic',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(200,16,46,0.06)',
        pointerEvents: 'none',
        userSelect: 'none',
        letterSpacing: -8,
        lineHeight: 1,
      }}>
        DXD
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(200,16,46,0.22)',
        borderRadius: 3,
        padding: '44px 36px 40px',
        textAlign: 'center',
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(to right, var(--red), transparent)',
        }} />

        {/* Icon */}
        <div style={{
          width: 52,
          height: 52,
          border: '1px solid rgba(200,16,46,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 10 }}>
          DXD Protocol
        </p>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.7rem, 4vw, 2.2rem)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: 'var(--tracking-snug)',
          lineHeight: 1.1,
        }}>
          Authenticate
        </h1>

        {/* Wallet badge */}
        {walletAddress && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            padding: '5px 12px',
            marginBottom: 18,
            letterSpacing: '0.05em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </div>
        )}

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 24 }}>
          {STATUS_DESC[status]}
        </p>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, height: 3 }}>
          {STEPS.map((step, i) => {
            const isDone = status === 'done' || currentStep > i;
            const isActive = status === step;
            return (
              <div
                key={step}
                style={{
                  flex: 1,
                  background: isDone ? 'var(--green)' : isActive ? 'var(--red)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 1,
                  transition: 'background 0.3s',
                }}
              />
            );
          })}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(200,16,46,0.07)',
            border: '1px solid rgba(200,16,46,0.25)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--red-light)',
            marginBottom: 16,
            lineHeight: 1.5,
            textAlign: 'left',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={() => signIn()}
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: 8, opacity: isLoading ? 0.65 : 1 }}
        >
          {isLoading && <Spin />}
          {STATUS_LABEL[status]}
        </button>

        <p style={{ marginTop: 14, fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-ghost)', letterSpacing: '0.05em' }}>
          EIP-191 personal_sign — no gas, no cost
        </p>
      </div>
    </div>
  );
}
