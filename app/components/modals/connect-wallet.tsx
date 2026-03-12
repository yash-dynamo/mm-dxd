'use client';

import { IWalletConnector, WalletConnectors, appKit } from '@/config';
import { useActionStore } from '@/stores';
import Image from 'next/image';
import { useConnect, useConnectors } from 'wagmi';
import { ModalBox } from './components';
import { Iconify } from '@/components/ui/iconify';
import { usePrivy } from '@privy-io/react-auth';
import { useMemo, useState } from 'react';
import { hasExtensionProvider, isProbablyMobile } from '@/utils/device';
import { cn } from '@/lib/utils';

const Spinner = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={18}
    height={18}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const ConnectWalletModal = () => {
  const { setModal } = useActionStore();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { login } = usePrivy();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const isMobileLike = useMemo(() => isProbablyMobile(), []);

  const hasInjected = useMemo(
    () => hasExtensionProvider() || connectors.some((c) => (c as any).type === 'injected'),
    [connectors],
  );

  const CONNECTOR_LIST = useMemo(() => {
    const isInsidePhantomBrowser =
      typeof window !== 'undefined' && !!(window as any).phantom?.ethereum?.isPhantom;
    const isInsideRabbyBrowser =
      typeof window !== 'undefined' && !!(window as any).ethereum?.isRabby;

    const mapped = Object.values(WalletConnectors).map((connector) => {
      if (connector.id === 'io.phantom') return { ...connector, isInstalled: isInsidePhantomBrowser };
      if (connector.id === 'io.rabby') return { ...connector, isInstalled: isInsideRabbyBrowser };
      return { ...connector, isInstalled: connectors.some((c) => c.id === connector.id) };
    });

    if (isMobileLike) return mapped.filter((c) => c.id !== 'com.mpcvault.console');
    return mapped;
  }, [connectors, hasInjected, isMobileLike]);

  const handleConnect = async (connector: IWalletConnector) => {
    if (!connector.isInstalled && !isMobileLike) {
      window.open(connector.link, '_blank');
      return;
    }

    if (isMobileLike && connector.id === 'io.metamask') {
      setModal(null);
      appKit?.open({ view: 'Connect' });
      return;
    }

    const isInsidePhantomBrowser =
      typeof window !== 'undefined' && !!(window as any).phantom?.ethereum?.isPhantom;
    if (isMobileLike && connector.id === 'io.phantom' && !isInsidePhantomBrowser) {
      const url = new URL(window.location.href);
      url.searchParams.set('autoconnect', 'phantom');
      window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(url.toString())}`;
      return;
    }

    const isInsideRabbyBrowser =
      typeof window !== 'undefined' && !!(window as any).ethereum?.isRabby;
    if (isMobileLike && connector.id === 'io.rabby' && !isInsideRabbyBrowser) {
      setConnectingId(null);
      setModal('rabby-mobile-guide');
      return;
    }

    setConnectingId(connector.id);
    try {
      const wagmiConnector =
        connectors.find((c) => c.id === connector.id) ||
        (connector.id === 'io.phantom'
          ? connectors.find((c) => c.name?.toLowerCase() === 'phantom')
          : undefined);
      await connectAsync({ connector: wagmiConnector || connector.connector });
      setConnectingId(null);
      setModal(null);
    } catch (error: any) {
      if (error?.name === 'ConnectorAlreadyConnectedError') {
        setConnectingId(null);
        setModal(null);
        return;
      }
      console.error(error);
      setConnectingId(null);
    }
  };

  return (
    <ModalBox
      maxWidth="sm"
      title="Connect Wallet"
      titleLeftPadding
      active="connect-wallet"
      disableClose={false}
    >
      {/* Social login */}
      <div className="flex flex-col gap-2">
        <WalletRow
          onClick={() => { setModal(null); login({ loginMethods: ['email'] }); }}
          icon={<Iconify icon="fluent:mail-32-filled" width={18} height={18} />}
          label="Email"
        />
        <WalletRow
          onClick={() => { setModal(null); login({ loginMethods: ['google'] }); }}
          icon={<Iconify icon="logos:google-icon" width={18} height={18} />}
          label="Google"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: 1, background: 'var(--border-red-light)' }} />
        <span style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          or wallet
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-red-light)' }} />
      </div>

      {/* Wallet connectors */}
      <div className="flex flex-col gap-2">
        {CONNECTOR_LIST.map((connector) => {
          const isConnecting = connectingId === connector.id;
          return (
            <WalletRow
              key={connector.id}
              onClick={() => handleConnect(connector)}
              disabled={isConnecting}
              icon={
                isConnecting ? <Spinner /> : (
                  <Image
                    alt={connector.walletName}
                    src={connector.icon}
                    width={18}
                    height={18}
                    style={{ objectFit: 'contain', borderRadius: 4 }}
                  />
                )
              }
              label={connector.walletName}
              badge={
                isConnecting ? 'Connecting...' :
                !connector.isInstalled && !isMobileLike ? 'Not installed' : undefined
              }
            />
          );
        })}

        {/* More Wallets */}
        <WalletRow
          onClick={() => { setModal(null); appKit?.open(); }}
          icon={<Iconify icon="solar:wallet-bold" width={18} height={18} />}
          label="More Wallets"
          badge="WalletConnect"
        />

        {isMobileLike && (
          <WalletRow
            onClick={() => setModal('qr-scan')}
            icon={<Iconify icon="material-symbols:computer-outline" width={18} height={18} />}
            label="Link Desktop Wallet"
          />
        )}
      </div>

      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
          textAlign: 'center',
          lineHeight: 1.6,
          paddingTop: 4,
        }}
      >
        By connecting you agree to the{' '}
        <span style={{ color: 'var(--red)', cursor: 'pointer' }}>Terms of Service</span>
      </p>
    </ModalBox>
  );
};

const WalletRow = ({
  icon,
  label,
  badge,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn('flex items-center gap-3 w-full transition-all group')}
    style={{
      padding: '10px 14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-red-medium)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
    }}
  >
    <span style={{ color: 'var(--text-secondary)', flexShrink: 0, display: 'flex' }}>{icon}</span>
    <span
      style={{
        flex: 1,
        textAlign: 'left',
        fontSize: 'var(--text-md)',
        fontWeight: 500,
        color: 'var(--text-primary)',
        letterSpacing: '0.2px',
      }}
    >
      {label}
    </span>
    {badge && (
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {badge}
      </span>
    )}
    <Iconify
      icon="mingcute:right-line"
      width={14}
      height={14}
      style={{ color: 'var(--text-dim)', flexShrink: 0 }}
    />
  </button>
);
