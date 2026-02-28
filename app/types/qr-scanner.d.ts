declare module 'qr-scanner' {
  export type QrScannerResult = {
    data: string;
  };

  export default class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onDecode: (result: QrScannerResult) => void,
      options?: {
        preferredCamera?: 'user' | 'environment';
        highlightScanRegion?: boolean;
        highlightCodeOutline?: boolean;
        returnDetailedScanResult?: boolean;
      },
    );
    start(): Promise<void>;
    stop(): Promise<void>;
    destroy(): void;
    static hasCamera(): Promise<boolean>;
  }
}
