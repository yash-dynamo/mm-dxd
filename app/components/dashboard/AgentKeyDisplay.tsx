'use client';

import { useMemo, useState } from 'react';

const mono =
  'var(--font-mono), ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace';

interface AgentKeyDisplayProps {
  privateKey: string;
  agentAddress: string;
  onConfirmed: () => void;
}

export function AgentKeyDisplay({ privateKey, agentAddress, onConfirmed }: AgentKeyDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  /** Placeholder matches real key length so layout does not jump when toggling. */
  const maskedKey = useMemo(
    () => (privateKey.length > 0 ? '\u2022'.repeat(privateKey.length) : '\u2022\u2022\u2022\u2022\u2022\u2022'),
    [privateKey],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `DXD Agent Wallet\nAddress: ${agentAddress}\nPrivate Key: ${privateKey}\n\nStore this file securely. It will not be shown again.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dxd-agent-${agentAddress.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 18px)' }}>
      {/* Warning */}
      <div
        style={{
          padding: '14px 16px',
          background: 'rgba(201,162,39,0.06)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: 'var(--tracking-wide)',
            marginBottom: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Save your private key — shown only once
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--gold-light)', opacity: 0.7, lineHeight: 1.5 }}>
          This key authorises order signing. If lost, you must register a new agent wallet.
        </p>
      </div>

      {/* Agent address */}
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: 'var(--tracking-label)', marginBottom: 6 }}>
          AGENT ADDRESS
        </p>
        <div
          style={{
            fontFamily: mono,
            fontSize: 'clamp(10px, 2.6vw, 12px)',
            lineHeight: 1.4,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere',
          }}
        >
          {agentAddress}
        </div>
      </div>

      {/* Private key */}
      <div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', letterSpacing: 'var(--tracking-label)', marginBottom: 6 }}>
          PRIVATE KEY
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            gap: 0,
            minWidth: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            minHeight: 34,
          }}
        >
          <div
            className="secret-inline-scroll"
            aria-label={revealed ? 'Agent private key' : 'Agent private key (hidden)'}
            title={revealed ? 'Scroll or swipe to see the full key' : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'block',
              fontFamily: mono,
              fontSize: 'clamp(8px, 2.15vw, 10px)',
              lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: revealed ? '0.015em' : '0.04em',
              color: revealed ? 'var(--text-primary)' : 'var(--text-dim)',
              padding: '7px 10px',
              whiteSpace: 'nowrap',
              userSelect: revealed ? 'text' : 'none',
              WebkitUserSelect: revealed ? 'text' : 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            spellCheck={false}
          >
            {revealed ? privateKey : maskedKey}
          </div>
          <button
            type="button"
            aria-label={revealed ? 'Hide private key' : 'Show private key'}
            aria-pressed={revealed}
            onClick={() => setRevealed((r) => !r)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'clamp(38px, 10vw, 44px)',
              alignSelf: 'stretch',
              background: 'rgba(255,255,255,0.02)',
              border: 'none',
              borderLeft: '1px solid var(--border-subtle)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              cursor: 'pointer',
              color: 'var(--text-dim)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {revealed ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="agent-key-actions" style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleCopy} className="btn btn-outline-red" style={{ flex: 1 }}>
          {copied ? 'COPIED' : 'COPY KEY'}
        </button>
        <button onClick={handleDownload} className="btn btn-outline-red" style={{ flex: 1 }}>
          DOWNLOAD .TXT
        </button>
      </div>

      {/* Confirmation checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 2, accentColor: 'var(--red)' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(10px, 2.8vw, 12px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          I have saved my private key in a secure location and understand it will not be shown again.
        </span>
      </label>

      <button
        onClick={onConfirmed}
        disabled={!confirmed}
        className="btn btn-primary"
        style={{ width: '100%', opacity: confirmed ? 1 : 0.3 }}
      >
        REGISTER AGENT ON-CHAIN
      </button>
    </div>
  );
}
