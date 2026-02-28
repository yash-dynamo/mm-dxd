import QrScanner, { QrScannerResult } from 'qr-scanner';

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect: (
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData,
  ) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

export type QrScannerController = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  destroy: () => void;
};

type CreateScannerParams = {
  videoEl: HTMLVideoElement;
  onResult: (text: string) => void;
  onError: (msg: string) => void;
  onDetectingChange: (state: boolean) => void;
};

export function createHybridQrScanner({
  videoEl,
  onResult,
  onError,
  onDetectingChange,
}: CreateScannerParams): QrScannerController {
  // Prefer native detector when available.
  const canUseNative =
    typeof window !== 'undefined' &&
    typeof (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector !==
      'undefined';

  if (canUseNative) {
    const { BarcodeDetector } = window as unknown as { BarcodeDetector: BarcodeDetectorCtor };
    let detector: BarcodeDetectorInstance | null = new BarcodeDetector({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let rafId: number | null = null;

    const stop = async () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      onDetectingChange(false);
    };

    const destroy = () => {
      detector = null;
    };

    const start = async () => {
      if (!detector) {
        detector = new BarcodeDetector({ formats: ['qr_code'] });
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        videoEl.srcObject = stream;
        await videoEl.play();
        onDetectingChange(true);

        const tick = async () => {
          if (!detector) return;
          try {
            const codes = await detector.detect(videoEl);
            const qr = codes.find((c) => c.rawValue);
            if (qr?.rawValue) {
              await stop();
              onResult(qr.rawValue);
              return;
            }
          } catch (err) {
            console.error('Native QR detect error', err);
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        console.error('Native QR start failed', err);
        await stop();
        throw err;
      }
    };

    return { start, stop, destroy };
  }

  // Fallback to qr-scanner library.
  let scanner: QrScanner | null = null;

  const stopFallback = async () => {
    if (scanner) {
      await scanner.stop();
    }
    onDetectingChange(false);
  };

  const destroyFallback = () => {
    if (scanner) {
      scanner.destroy();
      scanner = null;
    }
  };

  const startFallback = async () => {
    try {
      scanner = new QrScanner(
        videoEl,
        (result: QrScannerResult) => {
          if (result?.data) {
            stopFallback().finally(() => onResult(result.data));
          }
        },
        {
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
        },
      );
      await scanner.start();
      onDetectingChange(true);
    } catch (err) {
      console.error('QR scan start failed', err);
      await stopFallback();
      throw err;
    }
  };

  return { start: startFallback, stop: stopFallback, destroy: destroyFallback };
}
