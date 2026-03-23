'use client';

/**
 * WalletSetupModal
 *
 * On every open: runs a live infoClient.getAgents() to verify on-chain state.
 * Only shows "Ready to Trade" if the exchange actually has the agent registered.
 * If not confirmed → falls through to the real setup flow with wallet signatures.
 *
 * Steps:
 *   1. Approve builder fee  — exchange.approveBrokerFee(...)
 *   2. Register trading agent — exchange.addAgent(...)
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ExchangeClient, HttpTransport, InfoClient } from '@hotstuff-labs/ts-sdk';
import { toast } from 'sonner';
import { useActionStore, useAuthStore } from '@/stores';
import server from '@/config/server';
import { ModalBox } from './components';
import { Iconify } from '@/components/ui/iconify';
import { cn } from '@/lib/utils';

// ─── Config ───────────────────────────────────────────────────────────────────
const BROKER_ADDRESS =
  (process.env.NEXT_PUBLIC_BROKER_ADDRESS as `0x${string}`) ?? '';
const MAX_FEE_RATE     = process.env.NEXT_PUBLIC_MAX_FEE_RATE     ?? '0.001';
const AGENT_NAME       = process.env.NEXT_PUBLIC_AGENT_NAME       ?? 'trading-agent';
const AGENT_VALID_DAYS = parseInt(process.env.NEXT_PUBLIC_AGENT_VALID_DAYS ?? '30', 10);

// ─── SDK helpers (same pattern as reference) ──────────────────────────────────
function makeTransport() {
  return new HttpTransport({ isTestnet: false, ...server.http });
}

function makeInfoClient() {
  return new InfoClient({ transport: makeTransport() });
}

async function buildWalletClient(
  address: string,
  connector: ReturnType<typeof useAccount>['connector'],
) {
  if (!connector) throw new Error('No connector — wallet not connected');
  const provider = await connector.getProvider();

  // Switch the wallet to mainnet before creating the client — viem v2
  // validates that the provider's active chainId matches the declared chain.
  try {
    await (provider as any).request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    });
  } catch {
    // Wallet may already be on mainnet, or doesn't support programmatic switching
  }

  return createWalletClient({
    account:   address as `0x${string}`,
    chain:     mainnet,
    transport: custom(provider as any),
  });
}

function buildExchangeClient(walletClient: ReturnType<typeof createWalletClient>) {
  return new ExchangeClient({ transport: makeTransport(), wallet: walletClient });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type VerifyState =
  | 'checking'      // running SDK calls
  | 'no-account'    // accountInfo() threw — account not on exchange
  | 'no-deposit'    // account exists but zero equity/collateral
  | 'needs-setup'   // account + deposits OK, but no agent registered
  | 'confirmed'     // agent confirmed on-chain — ready to trade
  | 'error';        // unexpected API failure
type Step = 'idle' | 'approve-fee' | 'add-agent' | 'done' | 'error';

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spin = ({ size = 16 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
export const WalletSetupModal = () => {
  const { setModal }                                        = useActionStore();
  const { address: storeAddress, setStatus, setAgent }      = useAuthStore();
  const { address: wagmiAddress, connector }                = useAccount();
  const activeAddress = (wagmiAddress ?? storeAddress) as string;

  // ── Live verification state ────────────────────────────────────────────────
  const [verify,     setVerify]     = useState<VerifyState>('checking');
  const [verifyErr,  setVerifyErr]  = useState('');

  // ── Setup step state ───────────────────────────────────────────────────────
  const [step,        setStep]        = useState<Step>('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [feeApproved, setFeeApproved] = useState(false);

  const handleClose = useCallback(() => setModal(null), [setModal]);

  // ── On mount: three sequential SDK checks ────────────────────────────────
  // 1. accountInfo()   → account exists?
  // 2. accountSummary() → has deposits / equity?
  // 3. agents()         → has trading agent?
  useEffect(() => {
    if (!activeAddress) {
      setVerify('no-account');
      return;
    }

    let cancelled = false;

    (async () => {
      setVerify('checking');
      setVerifyErr('');
      const info = makeInfoClient();
      const user = activeAddress as `0x${string}`;

      // ── 1. Account existence ─────────────────────────────────────────────
      try {
        await info.accountInfo({ user });
      } catch {
        if (cancelled) return;
        setStatus('user-not-found');
        setVerify('no-account');
        return;
      }
      if (cancelled) return;

      // ── 2. Deposit / equity check ─────────────────────────────────────────
      try {
        const summary = await info.accountSummary({ user });
        if (cancelled) return;

        const hasDeposits =
          (summary as any).total_account_equity > 0 ||
          Object.values((summary as any).collateral       ?? {}).some((c: any) => c.balance > 0) ||
          Object.values((summary as any).spot_collateral  ?? {}).some((c: any) => c.balance > 0);

        if (!hasDeposits) {
          setStatus('connected');
          setVerify('no-deposit');
          return;
        }
      } catch {
        // If summary fails, continue — don't block on this check
      }
      if (cancelled) return;

      // ── 3. Agent check ────────────────────────────────────────────────────
      try {
        const agents   = await info.agents({ user });
        if (cancelled) return;
        const hasAgent = Array.isArray(agents) && agents.length > 0;
        if (hasAgent) {
          setStatus('trading-enabled');
          setVerify('confirmed');
        } else {
          setStatus('connected');
          setVerify('needs-setup');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Could not reach exchange API.';
        setVerifyErr(msg);
        setVerify('error');
      }
    })();

    return () => { cancelled = true; };
  }, [activeAddress]);

  // ── Step 1: Approve builder fee ────────────────────────────────────────────
  const approveFee = useCallback(async () => {
    if (!activeAddress || !connector) return;
    setStep('approve-fee');
    setErrorMsg('');
    try {
      if (!BROKER_ADDRESS) {
        // Dev mode: no broker configured, skip
        setFeeApproved(true);
        setStep('idle');
        return;
      }
      const walletClient = await buildWalletClient(activeAddress, connector);
      const exchange     = buildExchangeClient(walletClient);
      const tx = await exchange.approveBrokerFee({
        broker:     BROKER_ADDRESS,
        maxFeeRate: MAX_FEE_RATE,
        nonce:      Date.now(),
      });
      console.log('approveBrokerFee tx', tx);
      setFeeApproved(true);
      setStep('idle');
      toast.success('Builder fee approved', {
        description: `Max fee rate: ${MAX_FEE_RATE}`,
        duration: 3000,
        style: { borderLeftColor: '#22c55e', borderLeftWidth: 3 },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Approval failed — please retry.';
      setErrorMsg(msg);
      setStep('error');
      toast.error('Builder fee approval failed', {
        description: 'Please try again.',
        duration: 4000,
        style: { borderLeftColor: '#ef4444', borderLeftWidth: 3 },
      });
    }
  }, [activeAddress, connector]);

  // ── Step 2: Generate + register trading agent ──────────────────────────────
  const addAgent = useCallback(async () => {
    if (!activeAddress || !connector) return;
    setStep('add-agent');
    setErrorMsg('');
    try {
      const privKey      = generatePrivateKey();
      const account      = privateKeyToAccount(privKey);
      const agentAddress = account.address;
      const walletClient = await buildWalletClient(activeAddress, connector);
      const exchange     = buildExchangeClient(walletClient);
      await exchange.addAgent({
        agentName:       AGENT_NAME,
        agent:           agentAddress,
        forAccount:      '' as `0x${string}`,
        signer:          activeAddress,
        validUntil:      Date.now() + AGENT_VALID_DAYS * 24 * 60 * 60 * 1000,
        agentPrivateKey: privKey,
      });
      setAgent(activeAddress, { name: AGENT_NAME, address: agentAddress, privateKey: privKey });
      setStatus('trading-enabled');
      setStep('done');
      toast.success('Trading agent registered', {
        description: 'Your account is fully set up.',
        duration: 3000,
        style: { borderLeftColor: '#22c55e', borderLeftWidth: 3 },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Agent registration failed — please retry.';
      setErrorMsg(msg);
      setStep('error');
      toast.error('Agent registration failed', {
        description: 'Please try again.',
        duration: 4000,
        style: { borderLeftColor: '#ef4444', borderLeftWidth: 3 },
      });
    }
  }, [activeAddress, connector, setAgent, setStatus]);

  const isBusy = step === 'approve-fee' || step === 'add-agent';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER BRANCHES
  // ─────────────────────────────────────────────────────────────────────────

  // ── Checking ──────────────────────────────────────────────────────────────
  if (verify === 'checking') {
    return (
      <ModalBox maxWidth="sm" title="Verifying Account" active="wallet-setup" disableClose>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0 8px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(204,51,51,0.08)', border: '1px solid var(--border-red-medium)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Spin size={24} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Checking Exchange
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Querying the exchange API for your account and agent status…
            </div>
          </div>
          <AddressBadge address={activeAddress} />
        </div>
      </ModalBox>
    );
  }

  // ── API error ─────────────────────────────────────────────────────────────
  if (verify === 'error') {
    return (
      <ModalBox maxWidth="sm" title="Connection Error" active="wallet-setup" disableClose={false}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0 4px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(204,51,51,0.1)', border: '1px solid var(--border-red-medium)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Iconify icon="mingcute:close-line" width={28} height={28} style={{ color: 'var(--red)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Could Not Verify
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {verifyErr || 'Failed to reach the exchange API.'}
            </div>
          </div>
          <AddressBadge address={activeAddress} />
        </div>
        <button
          onClick={() => setVerify('checking')}
          className="btn btn-outline-red w-full"
          style={{ borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label-wide)' }}
        >
          RETRY
        </button>
        <button onClick={handleClose} style={skipStyle}>
          Close
        </button>
      </ModalBox>
    );
  }

  // ── Confirmed on-chain ────────────────────────────────────────────────────
  if (verify === 'confirmed') {
    return (
      <ConfirmedScreen
        activeAddress={activeAddress}
        connector={connector}
        onClose={handleClose}
      />
    );
  }

  // ── No account on exchange ────────────────────────────────────────────────
  if (verify === 'no-account' || verify === 'no-deposit') {
    const isNoAccount = verify === 'no-account';
    return (
      <ModalBox maxWidth="sm" title={isNoAccount ? 'No Exchange Account' : 'No Deposits Found'} active="wallet-setup" disableClose={false}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '4px 0 2px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(201,162,39,0.08)', border: '1px solid var(--border-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Iconify
              icon={isNoAccount ? 'mingcute:user-question-line' : 'mingcute:safe-box-line'}
              width={24} height={24}
              style={{ color: 'var(--gold)' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {isNoAccount ? 'Account Not Found' : 'No Deposits Found'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {isNoAccount
                ? 'Your wallet has no exchange account yet. Create one and make a deposit at app.hotstuff.trade before continuing.'
                : 'Your account exists but has no collateral or equity. Make a deposit at app.hotstuff.trade to start trading.'}
            </div>
          </div>
          <AddressBadge address={activeAddress} />
        </div>

        {/* CTA → app.hotstuff.trade */}
        <a
          href="https://app.hotstuff.trade"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline-gold w-full"
          style={{ borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label-wide)', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
        >
          <Iconify icon="mingcute:external-link-line" width={14} height={14} />
          {isNoAccount ? 'CREATE ACCOUNT & DEPOSIT' : 'DEPOSIT ON HOTSTUFF'}
        </a>

        {/* Re-check once they've done it */}
        <button
          onClick={() => setVerify('checking')}
          className="btn btn-outline-red w-full"
          style={{ borderRadius: 'var(--radius-md)', padding: '11px', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label-wide)' }}
        >
          CHECK AGAIN
        </button>

        <button onClick={handleClose} style={skipStyle}>Close</button>
      </ModalBox>
    );
  }

  // ── Needs setup ───────────────────────────────────────────────────────────
  return (
    <ModalBox maxWidth="sm" title="Setup Trading" active="wallet-setup" disableClose={isBusy}>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
        Wallet connected. Complete two steps to start trading.
      </p>

      <div className="flex flex-col gap-3">
        <SetupStep
          number={1}
          title="Approve Builder Fee"
          description={`Authorise the platform to charge up to ${MAX_FEE_RATE} fee rate.`}
          status={feeApproved ? 'done' : step === 'approve-fee' ? 'loading' : 'pending'}
          onAction={approveFee}
          disabled={isBusy || feeApproved}
          actionLabel="APPROVE"
        />
        <SetupStep
          number={2}
          title="Register Trading Agent"
          description="Generate a delegated signing key for automated trade execution."
          status={step === 'done' ? 'done' : step === 'add-agent' ? 'loading' : 'pending'}
          onAction={addAgent}
          disabled={isBusy || !feeApproved || step === 'done'}
          actionLabel="REGISTER"
        />
      </div>

      {step === 'error' && errorMsg && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(204,51,51,0.08)', border: '1px solid var(--border-red-medium)',
          borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
          color: 'var(--red-light)', lineHeight: 1.5,
        }}>
          {errorMsg}
        </div>
      )}

      {step === 'done' && (
        <button
          onClick={handleClose}
          className="btn btn-solid-red w-full"
          style={{ borderRadius: 'var(--radius-md)', padding: '12px', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label-wide)' }}
        >
          START TRADING
        </button>
      )}

      {step !== 'done' && !isBusy && (
        <button onClick={handleClose} style={skipStyle}>
          Skip for now
        </button>
      )}
    </ModalBox>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const skipStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--text-dim)',
  background: 'none', border: 'none', cursor: 'pointer',
  letterSpacing: 'var(--tracking-wide)', textAlign: 'center', width: '100%',
};

const AddressBadge = ({ address }: { address: string }) =>
  address ? (
    <div style={{
      fontSize: 'var(--text-xs)', color: 'var(--text-dim)',
      fontFamily: 'var(--font-sans)', letterSpacing: 'var(--tracking-wide)',
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '6px 12px',
    }}>
      {address.slice(0, 8)}…{address.slice(-6)}
    </div>
  ) : null;

// ─── ConfirmedScreen ─────────────────────────────────────────────────────────
const ConfirmedScreen = ({
  activeAddress,
  connector,
  onClose,
}: {
  activeAddress: string;
  connector: ReturnType<typeof useAccount>['connector'];
  onClose: () => void;
}) => {
  const [feeState, setFeeState] = useState<'idle' | 'signing' | 'done' | 'error'>('idle');
  const [feeErr,   setFeeErr]   = useState('');

  const approveFee = useCallback(async () => {
    if (!activeAddress || !connector) return;
    setFeeState('signing');
    setFeeErr('');
    try {
      if (!BROKER_ADDRESS) {
        setFeeState('done');
        return;
      }
      const walletClient = await buildWalletClient(activeAddress, connector);
      const exchange     = buildExchangeClient(walletClient);
      const tx = await exchange.approveBrokerFee({
        broker:     BROKER_ADDRESS,
        maxFeeRate: MAX_FEE_RATE,
        nonce:      Date.now(),
      });
      console.log('approveBrokerFee tx', tx);
      setFeeState('done');
      toast.success('Builder fee approved', {
        description: `Max fee rate: ${MAX_FEE_RATE}`,
        duration: 3000,
        style: { borderLeftColor: '#22c55e', borderLeftWidth: 3 },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Approval failed — please retry.';
      setFeeErr(msg);
      setFeeState('error');
      toast.error('Builder fee approval failed', {
        description: 'Please try again.',
        duration: 4000,
        style: { borderLeftColor: '#ef4444', borderLeftWidth: 3 },
      });
    }
  }, [activeAddress, connector]);

  const isSigning = feeState === 'signing';

  return (
    <ModalBox maxWidth="sm" title="Trading Active" active="wallet-setup" disableClose={isSigning}>
      {/* Status header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '4px 0 2px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(0,200,100,0.1)', border: '1px solid rgba(0,200,100,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Iconify icon="mingcute:check-line" width={26} height={26} style={{ color: 'var(--green)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Ready to Trade
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Trading agent registered on-chain.
          </div>
        </div>
        <AddressBadge address={activeAddress} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-red-light)', margin: '2px 0' }} />

      {/* Broker fee section */}
      <div style={{
        padding: '14px 16px',
        background: feeState === 'done'
          ? 'rgba(0,200,100,0.04)'
          : feeState === 'error'
          ? 'rgba(204,51,51,0.04)'
          : 'var(--bg-card)',
        border: `1px solid ${
          feeState === 'done'
            ? 'rgba(0,200,100,0.2)'
            : feeState === 'error'
            ? 'var(--border-red-medium)'
            : 'var(--border-subtle)'
        }`,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        transition: 'border-color 0.25s, background 0.25s',
      }}>
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: feeState === 'done' ? 'rgba(0,200,100,0.12)' : 'rgba(204,51,51,0.08)',
          border: `1px solid ${feeState === 'done' ? 'rgba(0,200,100,0.35)' : 'var(--border-red-light)'}`,
          color: feeState === 'done' ? 'var(--green)' : 'var(--red)',
          fontSize: 'var(--text-sm)', fontWeight: 700,
        }}>
          {feeState === 'done'
            ? <Iconify icon="mingcute:check-line" width={14} height={14} />
            : <Iconify icon="mingcute:currency-dollar-2-line" width={14} height={14} />
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 2,
            color: feeState === 'done' ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}>
            Approve Builder Fee
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {feeState === 'done'
              ? `Approved — max fee rate: ${MAX_FEE_RATE}`
              : `Authorise the platform to charge up to ${MAX_FEE_RATE} fee rate.`
            }
          </div>
          {feeState === 'error' && feeErr && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--red-light)', marginTop: 4, lineHeight: 1.4 }}>
              {feeErr}
            </div>
          )}
        </div>

        {/* Action button */}
        {feeState !== 'done' && (
          <button
            onClick={approveFee}
            disabled={isSigning}
            className={cn('btn btn-outline-red', isSigning && 'opacity-60 cursor-not-allowed')}
            style={{ borderRadius: 'var(--radius-sm)', padding: '5px 12px', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)', flexShrink: 0 }}
          >
            {isSigning ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Spin size={12} /> Signing...
              </span>
            ) : feeState === 'error' ? 'RETRY' : 'APPROVE'}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        disabled={isSigning}
        className="btn btn-solid-red w-full"
        style={{ borderRadius: 'var(--radius-md)', padding: '12px', fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-label-wide)', opacity: isSigning ? 0.5 : 1 }}
      >
        CLOSE
      </button>
    </ModalBox>
  );
};

// ─── SetupStep ────────────────────────────────────────────────────────────────
const SetupStep = ({
  number, title, description, status, onAction, disabled, actionLabel,
}: {
  number: number; title: string; description: string;
  status: 'pending' | 'loading' | 'done';
  onAction: () => void; disabled: boolean; actionLabel: string;
}) => {
  const isDone    = status === 'done';
  const isLoading = status === 'loading';

  return (
    <div style={{
      padding: '14px 16px', background: 'var(--bg-card)',
      border: `1px solid ${isDone ? 'rgba(0,200,100,0.25)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start',
      gap: 12, transition: 'border-color 0.2s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDone ? 'rgba(0,200,100,0.12)' : 'rgba(204,51,51,0.08)',
        border: `1px solid ${isDone ? 'rgba(0,200,100,0.35)' : 'var(--border-red-light)'}`,
        fontSize: 'var(--text-sm)', fontWeight: 700,
        color: isDone ? 'var(--green)' : 'var(--red)',
      }}>
        {isDone ? <Iconify icon="mingcute:check-line" width={14} height={14} /> : number}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 2, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
          {title}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>

      {!isDone && (
        <button
          onClick={onAction}
          disabled={disabled}
          className={cn('btn btn-outline-red', disabled && 'opacity-40 cursor-not-allowed')}
          style={{ borderRadius: 'var(--radius-sm)', padding: '5px 12px', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)', flexShrink: 0 }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Spin size={12} /> Signing...
            </span>
          ) : actionLabel}
        </button>
      )}
    </div>
  );
};
