'use client';

import { useActionStore } from '@/stores';

export function ConnectStep() {
  const { setModal } = useActionStore();

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
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
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
          Connect Wallet
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          Connect your HotStuff wallet to access the DXD market-making dashboard.
        </p>

        <button
          onClick={() => setModal('connect-wallet')}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          CONNECT WALLET
        </button>
      </div>
    </div>
  );
}
