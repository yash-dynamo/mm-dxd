import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { toDataURL } from 'qrcode';
import { useRive } from '@rive-app/react-canvas';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { ModalBox } from '../components';
import { useActionStore, useAuthStore } from '@/stores';
import { useAccountActions } from '@/hooks/actions';
import { QrFlowState } from './qr-flow-state';
import { LoadingState } from './loading-state';
import { usePrivy } from '@privy-io/react-auth';

export const QRWalletModal = () => {
  const { address, isConnected } = useAccount();
  const { authenticated } = usePrivy();
  const { master, activeVault } = useAuthStore();
  const { addAgent } = useAccountActions();
  const hasRequestedSignatureRef = useRef(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState(false);
  const { setModal } = useActionStore();

  const { RiveComponent } = useRive({
    src: '/assets/loader.riv',
    autoplay: true,
  });

  useEffect(() => {
    if (hasRequestedSignatureRef.current) return;
    hasRequestedSignatureRef.current = true;

    const requestSignature = async () => {
      try {
        if ((!isConnected || !address) && !authenticated) {
          console.warn('QR wallet signing skipped: no connected wallet detected.');
          return;
        }

        const qrAgentPrivateKey = generatePrivateKey();
        const qrAgentAccount = privateKeyToAccount(qrAgentPrivateKey);
        const qrAgentName = 'qr-code';
        const validUntil = Date.now() + 180 * 24 * 60 * 60 * 1000; // 180 days
        const forAccount =
          activeVault === '0x0000000000000000000000000000000000000000' ? '' : activeVault;

        const signer = (master || address) as `0x${string}`;

        try {
          const result = await addAgent(
            qrAgentName,
            qrAgentAccount.address,
            qrAgentPrivateKey,
            forAccount,
            validUntil,
            signer,
            true,
            { skipToast: true, context: { source: 'qr' } },
          );
          if (!result.success) {
            console.error('QR agent creation failed:', result.error);
            setModal(null);
            return;
          }
        } catch (error) {
          console.error('QR agent creation failed:', error);
          setModal(null);
        }

        // Bundle agent into base64 for the QR link without an additional signature prompt.
        const payload = {
          signer: address,
          agent: {
            name: qrAgentName,
            address: qrAgentAccount.address,
            privateKey: qrAgentPrivateKey,
          },
        };

        const json = JSON.stringify(payload);
        const base64 =
          typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(json))) : '';
        const link = `${window.location.origin}?link=${encodeURIComponent(base64)}`;

        const url = await toDataURL(link);
        setQrDataUrl(url);
      } catch (error) {
        hasRequestedSignatureRef.current = false;
        console.error('QR wallet signature failed', error);
      }
    };

    requestSignature();
  }, [address, isConnected]);

  const HOLD_DURATION_MS = 2000;

  const handleHoldStart = () => {
    if (!qrDataUrl || showQr) return;
    holdStartRef.current = Date.now();
    setIsHolding(true);
    setHoldProgress(0);

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(pct);
      if (pct >= 100 && holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setShowQr(true);
        setHoldProgress(100);
        setIsHolding(false);
        return;
      }
    }, 30);
  };

  const handleHoldEnd = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    if (!showQr) setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const renderState = () => {
    if (qrDataUrl) {
      return (
        <QrFlowState
          qrDataUrl={qrDataUrl}
          showQr={showQr}
          holdProgress={holdProgress}
          onHoldStart={handleHoldStart}
          onHoldEnd={handleHoldEnd}
          isHolding={isHolding}
        />
      );
    }
    return <LoadingState RiveComponent={RiveComponent} />;
  };

  return (
    <ModalBox title={`Link Mobile Device`} active={'qr-wallet'}>
      {renderState()}
    </ModalBox>
  );
};
