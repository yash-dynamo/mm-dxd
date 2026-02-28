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

// Simple spinner component
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
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
    // Detect if we're inside wallet in-app browsers
    const isInsidePhantomBrowser =
      typeof window !== 'undefined' && !!(window as any).phantom?.ethereum?.isPhantom;
    const isInsideRabbyBrowser =
      typeof window !== 'undefined' && !!(window as any).ethereum?.isRabby;

    const mapped = Object.values(WalletConnectors).map((connector) => {
      if (connector.id === 'io.phantom') {
        return { ...connector, isInstalled: isInsidePhantomBrowser };
      }

      if (connector.id === 'io.rabby') {
        return { ...connector, isInstalled: isInsideRabbyBrowser };
      }

      return {
        ...connector,
        isInstalled: connectors.some((c) => c.id === connector.id),
      };
    });

    // On mobile, filter out desktop-only wallets
    // MetaMask stays visible but routes to WalletConnect (see handleConnect)
    if (isMobileLike) {
      const hideOnMobile = [
        'com.mpcvault.console', // MPC Vault is desktop-only
      ];
      return mapped.filter((c) => !hideOnMobile.includes(c.id));
    }
    return mapped;
  }, [connectors, hasInjected, isMobileLike]);

  const handleConnect = async (connector: IWalletConnector) => {
    // On desktop, if not installed, open download page
    if (!connector.isInstalled && !isMobileLike) {
      window.open(connector.link, '_blank');
      return;
    }

    // On mobile, MetaMask uses AppKit/Reown - opens directly to MetaMask connection
    // This avoids MetaMask SDK issues and provides a cleaner UX
    if (isMobileLike && connector.id === 'io.metamask') {
      setModal(null); // Close our modal, AppKit modal will open
      // Open AppKit with MetaMask connector directly
      appKit?.open({ view: 'Connect' });
      return;
    }

    // On mobile, Phantom needs manual deep linking UNLESS we're already inside Phantom's browser
    const isInsidePhantomBrowser =
      typeof window !== 'undefined' && !!(window as any).phantom?.ethereum?.isPhantom;
    if (isMobileLike && connector.id === 'io.phantom' && !isInsidePhantomBrowser) {
      // Add autoconnect flag so page auto-connects when opened in Phantom browser
      const url = new URL(window.location.href);
      url.searchParams.set('autoconnect', 'phantom');
      const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(url.toString())}`;
      window.location.href = phantomDeepLink;
      // Don't clear loading - user is leaving the page
      return;
    }

    // On mobile, Rabby doesn't have deep links - educate users
    const isInsideRabbyBrowser =
      typeof window !== 'undefined' && !!(window as any).ethereum?.isRabby;
    if (isMobileLike && connector.id === 'io.rabby' && !isInsideRabbyBrowser) {
      setConnectingId(null);
      setModal('rabby-mobile-guide');
      return;
    }

    try {
      const wagmiConnector =
        connectors.find((c) => c.id === connector.id) ||
        (connector.id === 'io.phantom'
          ? connectors.find((c) => c.name?.toLowerCase() === 'phantom')
          : undefined);
      const connectorToUse = wagmiConnector || connector.connector;
      await connectAsync({ connector: connectorToUse });
      setConnectingId(null);
      setModal(null);
    } catch (error) {
      console.error(error);
      setConnectingId(null);
    }
  };

  const handleOpenAppKit = () => {
    setModal(null);
    appKit?.open();
  };

  return (
    <ModalBox
      maxWidth="sm"
      title={'Connect Wallet'}
      titleLeftPadding={true}
      active={'connect-wallet'}
      disableClose={false}
    >
      <WalletItem
        onClick={() => {
          setModal(null);
          login({
            loginMethods: ['email'],
          });
        }}
      >
        <Iconify
          icon="fluent:mail-32-filled"
          width={24}
          height={24}
          className="text-muted-foreground"
        />
        Email
      </WalletItem>

      <WalletItem
        onClick={() => {
          setModal(null);
          login({
            loginMethods: ['google'],
          });
        }}
      >
        <Iconify icon="logos:google-icon" width={24} height={24} />
        Google
      </WalletItem>

      <div className="flex items-center text-center">
        <div className="flex-1 border-t border-dashed border-border" />
        <span className="text-xs text-muted-foreground mx-3">OR</span>
        <div className="flex-1 border-t border-dashed border-border" />
      </div>

      {CONNECTOR_LIST.map((connector) => {
        const isConnecting = connectingId === connector.id;
        return (
          <WalletItem
            key={`connector-${connector.walletName}`}
            onClick={() => handleConnect(connector)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Spinner className="text-muted-foreground" />
            ) : (
              <Image
                alt={`${connector.walletName}-icon`}
                src={connector.icon}
                width={24}
                height={24}
                style={{ objectFit: 'cover' }}
              />
            )}
            {connector.walletName}
            {isConnecting && (
              <span className="text-xs text-muted-foreground ml-auto">Connecting...</span>
            )}
            {!connector.isInstalled && !isMobileLike && !isConnecting && (
              <span className="text-xs text-muted-foreground ml-auto">Not Installed</span>
            )}
          </WalletItem>
        );
      })}

      {/* More Wallets - Opens AppKit modal with all wallets + QR code */}
      <WalletItem onClick={handleOpenAppKit}>
        <Iconify
          width={24}
          height={24}
          icon="solar:wallet-bold"
          className="text-muted-foreground"
        />
        More Wallets
      </WalletItem>

      {isMobileLike && (
        <WalletItem onClick={() => setModal('qr-scan')}>
          <Iconify
            width={24}
            height={24}
            icon="material-symbols:computer-outline"
            className="text-muted-foreground"
          />
          Link Desktop Wallet
        </WalletItem>
      )}
    </ModalBox>
  );
};

const WalletItem = ({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center gap-3 w-full p-4 rounded-md h-14',
      'bg-neutral-900 border-none font-normal justify-start',
      'text-sm leading-[18px]',
      'hover:bg-neutral-800 transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )}
  >
    {children}
  </button>
);
