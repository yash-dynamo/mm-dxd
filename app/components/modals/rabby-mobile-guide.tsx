'use client';

import { useActionStore } from '@/stores';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { ModalBox } from './components';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const RabbyMobileGuideModal = () => {
  const { setModal } = useActionStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalBox
      maxWidth="sm"
      title="Connect with Rabby"
      titleLeftPadding={true}
      active="rabby-mobile-guide"
      disableClose={false}
    >
      <div className="py-2">
        <div className="text-center mb-4">
          <Image
            alt="Rabby Wallet"
            src="/wallet-icons/rabby.png"
            width={64}
            height={64}
            style={{ objectFit: 'cover', borderRadius: 12 }}
          />
        </div>

        <div className="bg-neutral-900 rounded-lg p-4 text-left mb-6">
          <p className="text-sm text-muted-foreground mb-3">
            To connect with Rabby on mobile:
          </p>
          <StepItem>
            <StepNumber>1</StepNumber>
            <span className="text-sm text-foreground">Open the Rabby app</span>
          </StepItem>
          <StepItem>
            <StepNumber>2</StepNumber>
            <span className="text-sm text-foreground">
              Tap <strong>&quot;Dapps&quot;</strong> on the homepage
            </span>
          </StepItem>
          <StepItem>
            <StepNumber>3</StepNumber>
            <span className="text-sm text-foreground">
              Enter this site&apos;s URL (Copy using the button below)
            </span>
          </StepItem>
          <StepItem className="mb-0">
            <StepNumber>4</StepNumber>
            <span className="text-sm text-foreground">
              Connect from within Rabby&apos;s browser
            </span>
          </StepItem>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setModal('connect-wallet')}
            className="flex-1 gap-2"
          >
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            <span className="text-sm">Back</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCopy}
            className="flex-1 gap-2"
          >
            <Icon icon="mdi:content-copy" width={18} height={18} />
            <span className="text-sm">{copied ? 'Copied!' : 'Copy URL'}</span>
          </Button>
        </div>
      </div>
    </ModalBox>
  );
};

const StepItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex items-center gap-3 mb-3', className)}>{children}</div>
);

const StepNumber = ({ children }: { children: React.ReactNode }) => (
  <div className="w-6 h-6 rounded bg-neutral-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
    {children}
  </div>
);
