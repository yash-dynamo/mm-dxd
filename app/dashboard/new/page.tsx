'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDxdAuthStore, useDxdSessionsStore } from '@/stores';
import { useSessions } from '@/hooks/dxd';
import { useAgentSetup } from '@/hooks/dxd';
import { SymbolSelector } from '@/components/dashboard/SymbolSelector';
import { ConfigForm } from '@/components/dashboard/ConfigForm';
import { env } from '@/config/env';
import type { CreateSessionRequest, SymbolConfig } from '@/lib/dxd-api';

export default function NewSessionPage() {
  const router = useRouter();
  const { agentAddress } = useDxdAuthStore();
  const { configDefaults, sessions, isLoadingDefaults } = useDxdSessionsStore();
  const { loadDefaults, createSession } = useSessions();
  const { getAgentPrivateKey } = useAgentSetup();

  const [symbols, setSymbols] = useState<string[]>([]);
  const [globalConfig, setGlobalConfig] = useState<Partial<SymbolConfig>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brokerAddress = env.NEXT_PUBLIC_BROKER_ADDRESS;
  const maxFeeRate = env.NEXT_PUBLIC_MAX_FEE_RATE ?? '0.001';

  useEffect(() => {
    loadDefaults();
  }, []);

  const conflictSymbols = sessions
    .filter((s) => s.status === 'running' || s.status === 'starting')
    .flatMap((s) => s.symbols);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symbols.length === 0 || !agentAddress) return;

    const pk = getAgentPrivateKey();
    if (!pk) {
      setError('Agent private key not found in session. Please set up your agent wallet again.');
      return;
    }
    if (!brokerAddress) {
      setError('Broker address is not configured. Set NEXT_PUBLIC_BROKER_ADDRESS in .env.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateSessionRequest = {
        agent_address: agentAddress,
        agent_private_key: pk,
        symbols,
        config: Object.keys(globalConfig).length > 0 ? globalConfig : undefined,
        broker_address: brokerAddress,
        broker_config: {
          broker_address: brokerAddress,
          max_fee_rate: maxFeeRate,
        },
      };

      const session = await createSession(payload);
      router.push(`/dashboard/sessions/${session.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: 20,
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
        </svg>
        BACK
      </button>

      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--text-7xl)',
          fontWeight: 500,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-normal)',
          marginBottom: 4,
        }}
      >
        New Session
      </h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)', marginBottom: 32 }}>
        Configure and start a market-making session.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Symbols */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-3xl)',
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}
          >
            Symbols
          </h2>
          <SymbolSelector value={symbols} onChange={setSymbols} disabledSymbols={conflictSymbols} />
        </div>

        {/* Config */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-3xl)',
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Global Config
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 16, letterSpacing: 'var(--tracking-wide)' }}>
            Applied to all symbols. Per-symbol overrides can be set after start.
          </p>
          {isLoadingDefaults ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-dim)' }}>Loading defaults…</p>
          ) : (
            <ConfigForm
              value={globalConfig}
              onChange={setGlobalConfig}
              defaults={configDefaults?.defaults?.['HYPE-PERP']}
            />
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid var(--border-red-medium)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--red-light)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={symbols.length === 0 || isSubmitting}
          className="btn btn-primary"
          style={{ width: '100%', opacity: symbols.length === 0 || isSubmitting ? 0.4 : 1 }}
        >
          {isSubmitting ? 'STARTING…' : 'START SESSION'}
        </button>
      </form>
    </div>
  );
}
