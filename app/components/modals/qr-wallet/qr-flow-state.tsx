import { Iconify } from '@/components/ui/iconify';
import { Button } from '@/components/ui/button';
import { getSubdomainHostname } from '@/utils/subdomain-url';
import { cn } from '@/lib/utils';

type QrFlowProps = {
  qrDataUrl: string;
  showQr: boolean;
  holdProgress: number;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isHolding: boolean;
};

type HoldButtonProps = {
  holdProgress: number;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isHolding: boolean;
};

type QrDisplayProps = {
  qrDataUrl: string;
};

export const QrFlowState = ({
  qrDataUrl,
  showQr,
  holdProgress,
  onHoldStart,
  onHoldEnd,
  isHolding,
}: QrFlowProps) => (
  <div className="flex flex-col gap-4 items-center">
    <p className="text-sm text-muted-foreground text-center mb-4">
      Open {getSubdomainHostname()} on mobile <br /> and click "Connect" to link this wallet.
    </p>
    {showQr && holdProgress >= 100 ? (
      <QrDisplay qrDataUrl={qrDataUrl} />
    ) : (
      <HoldButton
        holdProgress={holdProgress}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
        isHolding={isHolding}
      />
    )}
    <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 rounded-md">
      <Iconify
        icon="mingcute:alert-octagon-line"
        width={20}
        height={20}
        className="text-red-400 shrink-0"
      />
      <p className="text-sm text-red-300">
        The QR code enables mobile trading, but not deposits and withdrawals. Do not share this QR
        code or screenshots of it with others. Make sure you are not sharing your screen.
      </p>
    </div>
  </div>
);

const HoldButton = ({ holdProgress, onHoldStart, onHoldEnd, isHolding }: HoldButtonProps) => (
  <Button
    size="lg"
    className="w-full"
    onMouseDown={onHoldStart}
    onMouseUp={onHoldEnd}
    onMouseLeave={onHoldEnd}
    onTouchStart={onHoldStart}
    onTouchEnd={onHoldEnd}
  >
    <div className="relative self-center h-5 w-5">
      {/* Background circle */}
      <svg className="absolute top-0 left-0 w-5 h-5" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-30"
        />
      </svg>
      {/* Progress circle */}
      <svg className="absolute top-0 left-0 w-5 h-5 -rotate-90" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${(holdProgress / 100) * 44} 44`}
          className={cn(
            'transition-[stroke-dasharray] duration-[60ms] linear',
            isHolding ? 'opacity-100' : 'opacity-70'
          )}
        />
      </svg>
    </div>
    Hold to Reveal
  </Button>
);

const QrDisplay = ({ qrDataUrl }: QrDisplayProps) => (
  <img
    src={qrDataUrl}
    alt="QR to link wallet"
    className="w-60 h-60 self-center rounded-lg bg-white"
  />
);
