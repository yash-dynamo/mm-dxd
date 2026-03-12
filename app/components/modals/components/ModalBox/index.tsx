'use client';

import * as React from 'react';
import { Iconify } from '@/components/ui/iconify';
import { useActionStore, useAuthStore } from '@/stores';
import useMediaQuery from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

// Helper function to capitalize first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Map maxWidth to Tailwind classes
const maxWidthClasses = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

export const ModalBox = ({
  active,
  title,
  children,
  disableClose = false,
  maxWidth = 'xs',
  titleLeftPadding = false,
  className,
  mobileBottomSheet,
  open,
  onClose,
}: {
  active?: string | null;
  title: string;
  children: React.ReactNode;
  disableClose?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  titleLeftPadding?: boolean;
  className?: string;
  mobileBottomSheet?: boolean;
  open?: boolean;
  onClose?: () => void;
}) => {
  const { modal, setModal } = useActionStore();
  const isMobileDefault = useMediaQuery('(max-width: 1000px)');
  const isBottomSheet =
    typeof mobileBottomSheet === 'boolean' ? mobileBottomSheet : isMobileDefault;

  // Support both modal store pattern and direct open/onClose pattern
  const isOpen = open !== undefined ? open : modal === active;
  const handleClose = () => {
    if (!disableClose) {
      if (onClose) {
        onClose();
      } else {
        setModal(null);
      }
    }
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase',
    color: 'var(--text-primary)',
  };

  const CloseButton = () => (
    <button
      onClick={handleClose}
      disabled={disableClose}
      style={{
        background: 'none',
        border: 'none',
        cursor: disableClose ? 'not-allowed' : 'pointer',
        opacity: disableClose ? 0.4 : 1,
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: 'var(--radius-sm)',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { if (!disableClose) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
    >
      <Iconify icon="mingcute:close-line" width={16} height={16} />
    </button>
  );

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 'var(--space-5)',
    borderBottom: '1px solid var(--border-red-light)',
    marginBottom: 0,
  };

  if (isBottomSheet) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          {/* Drag handle */}
          <div style={{ width: 36, height: 3, borderRadius: 99, background: 'var(--border-red-medium)', margin: '12px auto 0' }} />
          <DrawerHeader style={{ ...headerStyle, padding: '12px 16px 12px' }}>
            <DrawerTitle style={titleStyle}>{capitalize(title)}</DrawerTitle>
            <CloseButton />
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-6 overflow-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(maxWidthClasses[maxWidth], className)}
        onEscapeKeyDown={disableClose ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={disableClose ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader style={headerStyle}>
          <DialogTitle style={titleStyle} className={cn(titleLeftPadding && 'pl-0.5')}>
            {capitalize(title)}
          </DialogTitle>
          <CloseButton />
        </DialogHeader>
        <div className="flex flex-col gap-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
