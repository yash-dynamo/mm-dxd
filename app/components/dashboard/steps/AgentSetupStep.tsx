'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAgentSetup } from '@/hooks/dxd';
import { AgentKeyDisplay } from '../AgentKeyDisplay';

const Spin = ({ size = 16 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

type Phase = 'form' | 'key-display' | 'registering';

interface AgentSetupStepProps {
  onComplete?: () => void;
}

export function AgentSetupStep({ onComplete }: AgentSetupStepProps) {
  const [phase, setPhase] = useState<Phase>('form');
  const [agentName, setAgentName] = useState('');

  const { address } = useAccount();
  const { setupStatus, generatedAgent, setupError, generateAgent, registerAgent } = useAgentSetup();

  useEffect(() => {
    if (setupStatus === 'done') {
      onComplete?.();
    }
  }, [setupStatus, onComplete]);

  const handleGenerate = () => {
    if (!agentName.trim()) return;
    generateAgent();
    setPhase('key-display');
  };

  const handleRegister = async () => {
    setPhase('registering');
    await registerAgent(agentName.trim());
  };

  return (
    <div
      className="agent-setup-shell flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="agent-setup-card"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-red-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 3vw, 16px)',
            marginBottom: 'clamp(20px, 4vw, 28px)',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.15rem, 4.5vw, 1.5rem)',
                fontWeight: 500,
                fontStyle: 'italic',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-normal)',
                lineHeight: 1.2,
              }}
            >
              Create Agent
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-dim)',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Wallet: {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>
          </div>
        </div>

        {/* Phase: form */}
        {phase === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}
            >
              An agent wallet signs orders on your behalf. Your main wallet authorises it once on-chain.
            </p>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-dim)',
                  letterSpacing: 'var(--tracking-label)',
                  marginBottom: 6,
                }}
              >
                AGENT NAME
              </label>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. My DXD Bot"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-md)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!agentName.trim()}
              className="btn btn-primary"
              style={{ width: '100%', opacity: !agentName.trim() ? 0.3 : 1 }}
            >
              GENERATE AGENT KEY
            </button>
          </div>
        )}

        {/* Phase: key display */}
        {phase === 'key-display' && generatedAgent && (
          <AgentKeyDisplay
            privateKey={generatedAgent.privateKey}
            agentAddress={generatedAgent.agentAddress}
            onConfirmed={handleRegister}
          />
        )}

        {/* Phase: registering */}
        {phase === 'registering' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {setupStatus === 'registering' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <Spin size={32} />
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  Waiting for wallet confirmation…
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: 6 }}>
                  You may see two wallet prompts: addAgent first, then broker fee approval.
                </p>
              </>
            )}
            {setupStatus === 'error' && (
              <>
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(204,51,51,0.08)',
                    border: '1px solid var(--border-red-medium)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--red-light)',
                    marginBottom: 12,
                  }}
                >
                  {setupError}
                </div>
                <button
                  onClick={() => setPhase('key-display')}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-dim)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Back
                </button>
              </>
            )}
            {setupStatus === 'done' && (
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--green)',
                }}
              >
                Agent created successfully.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
