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

  const CloseButton = () => (
    <button
      onClick={handleClose}
      disabled={disableClose}
      className={cn(
        'rounded-sm transition-colors',
        disableClose
          ? 'cursor-not-allowed opacity-50 text-muted-foreground'
          : 'cursor-pointer text-muted-foreground hover:text-foreground'
      )}
    >
      <Iconify icon="mingcute:close-line" width={18} height={18} />
    </button>
  );

  if (isBottomSheet) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="flex flex-row items-center justify-between px-4 py-4">
            <DrawerTitle className="text-base">{capitalize(title)}</DrawerTitle>
            <CloseButton />
          </DrawerHeader>
          <div className="flex flex-col gap-4 px-4 pb-4 overflow-auto">
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
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className={cn('text-base', titleLeftPadding && 'pl-0.5')}>
            {capitalize(title)}
          </DialogTitle>
          <CloseButton />
        </DialogHeader>
        <div className="flex flex-col gap-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
