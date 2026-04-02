'use client';

import { useActionStore } from '@/stores';

export function ConnectStep() {
  const { setModal } = useActionStore();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
    }}>
      {/* Background DXD watermark */}
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
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'var(--red)',
          marginBottom: 10,
        }}>
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
          Connect Wallet
        </h1>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-md)',
          color: 'var(--text-muted)',
          lineHeight: 1.65,
          marginBottom: 32,
        }}>
          Connect your HotStuff wallet to access the market-making dashboard.
        </p>

        <button
          onClick={() => setModal('connect-wallet')}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          CONNECT WALLET
        </button>
      </div>
    </div>
  );
}
