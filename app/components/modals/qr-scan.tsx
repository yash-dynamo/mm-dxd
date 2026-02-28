'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRive } from '@rive-app/react-canvas';

import { useActionStore, useAuthStore } from '@/stores';
import { extractLinkParam, recoverFromQrPayload } from '@/utils/qr-recover';
import { createHybridQrScanner, QrScannerController } from '@/utils/qr-scanner-hybrid';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Iconify } from '@/components/ui/iconify';

export const QrScanModal = () => {
  const { modal, setModal } = useActionStore();
  const { setAddress, setMaster, setAgent, setStatus } = useAuthStore();
  const { RiveComponent } = useRive({
    src: '/assets/loader.riv',
    autoplay: true,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControllerRef = useRef<QrScannerController | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const stopScan = useCallback(() => {
    if (scannerControllerRef.current) {
      scannerControllerRef.current.stop();
      scannerControllerRef.current.destroy();
      scannerControllerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
  }, []);

  const handleResult = useCallback(
    async (raw: string) => {
      stopScan();
      const linkParam = extractLinkParam(raw);
      const { success, error: recoverError } = await recoverFromQrPayload(linkParam, {
        setAddress,
        setMaster,
        setAgent,
        setStatus,
        setModal,
      });
      if (!success) {
        setError('Could not process QR. Try again.');
      }
    },
    [setAddress, setAgent, setMaster, setModal, setStatus, stopScan],
  );

  const startScan = useCallback(async () => {
    setError(null);
    setIsDetecting(false);
    if (typeof window === 'undefined') return;
    if (!videoRef.current) return;
    try {
      // ensure any previous streams/controllers are cleaned up
      if (scannerControllerRef.current) {
        await scannerControllerRef.current.stop();
        scannerControllerRef.current.destroy();
        scannerControllerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Always recreate controller to ensure fresh permissions/stream each open.
      scannerControllerRef.current = createHybridQrScanner({
        videoEl: videoRef.current,
        onResult: handleResult,
        onError: () => {
          /* handled in startScan catch */
        },
        onDetectingChange: (state) => setIsDetecting(state),
      });
      setIsDetecting(true);
      await scannerControllerRef.current.start();
    } catch (err) {
      console.error('QR scan start failed', err);
      setError('Camera access failed or QR scanning not supported on this device.');
      if (scannerControllerRef.current) {
        await scannerControllerRef.current.stop();
        scannerControllerRef.current.destroy();
        scannerControllerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsDetecting(false);
    }
  }, [handleResult]);

  useEffect(() => {
    if (modal === 'qr-scan') {
      setTimeout(() => {
        startScan();
      }, 0);
    }
    return () => {
      stopScan();
    };
  }, [modal, startScan, stopScan]);

  const open = modal === 'qr-scan';

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      stopScan();
      setModal(null);
    } else {
      startScan();
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="pb-6">
        <DrawerHeader className="flex flex-row items-center px-4 pb-2">
          <h2 className="text-lg font-semibold flex-1">Scan QR to Link</h2>
          <DrawerClose asChild>
            <button
              onClick={() => {
                stopScan();
                setModal(null);
              }}
              className="p-1 rounded-sm hover:bg-accent"
            >
              <Iconify icon="mingcute:close-line" width={20} height={20} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Point your camera at the QR from your desktop to pair this device.
          </p>
        </div>

        <div className="px-4 pb-4">
          <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-[3/4]">
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
            />
            {!isDetecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/80">
                <div className="w-24 h-24">
                  <RiveComponent style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 pb-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
