'use client';

import React from 'react';
import { toast } from 'sonner';
import SuccessToast from './components/success';
import InfoToast from './components/info';
import WarningToast from './components/warning';
import ErrorToast from './components/error';
import DefaultToast from './components/default';
import LoadingToast from './components/loading';

export interface ToastParams {
  message: string;
  description?: string;
  options?: {
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
    cancel?: {
      label: string;
      onClick: () => void;
    };
    icon?: React.ReactNode;
    closeButton?: boolean;
    dismissible?: boolean;
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDismiss?: (toast: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAutoClose?: (toast: any) => void;
    className?: string;
    style?: React.CSSProperties;
    unstyled?: boolean;
  };
}

export const defaultToastConfig = {
  duration: 5000,
  closeButton: true,
  dismissible: true,
};

export const showToast = {
  success: ({ message, description, options = {} }: ToastParams) => {
    const { action, duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <SuccessToast
          title={message}
          description={description}
          action={action}
          onClose={() => toast.dismiss(t)}
        />
      ),
      {
        duration: duration ?? defaultToastConfig.duration,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },

  error: ({ message, description, options = {} }: ToastParams) => {
    const { action, duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <ErrorToast
          title={message}
          description={description}
          action={action}
          onClose={() => toast.dismiss(t)}
        />
      ),
      {
        duration: duration ?? defaultToastConfig.duration,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },

  info: ({ message, description, options = {} }: ToastParams) => {
    const { action, duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <InfoToast
          title={message}
          description={description}
          action={action}
          onClose={() => toast.dismiss(t)}
        />
      ),
      {
        duration: duration ?? defaultToastConfig.duration,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },

  warning: ({ message, description, options = {} }: ToastParams) => {
    const { action, duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <WarningToast
          title={message}
          description={description}
          action={action}
          onClose={() => toast.dismiss(t)}
        />
      ),
      {
        duration: duration ?? defaultToastConfig.duration,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },
  default: ({ message, description, options = {} }: ToastParams) => {
    const { action, duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <DefaultToast
          title={message}
          description={description}
          action={action}
          onClose={() => toast.dismiss(t)}
        />
      ),
      {
        duration: duration ?? defaultToastConfig.duration,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },

  loading: ({ message, description, options = {} }: ToastParams) => {
    const { duration, ...rest } = options ?? {};
    return toast.custom(
      (t: string | number) => (
        <LoadingToast title={message} description={description} onClose={() => toast.dismiss(t)} />
      ),
      {
        duration: duration ?? Infinity,
        unstyled: true,
        closeButton: false,
        dismissible: true,
        ...rest,
      },
    );
  },

  promise: (
    promise: Promise<unknown>,
    {
      pending,
      success,
      error,
    }: { pending: string; success: string; error?: string; description?: string },
  ) => {
    const id = toast.custom(
      (t: string | number) => <LoadingToast title={pending} onClose={() => toast.dismiss(t)} />,
      {
        duration: Infinity,
        unstyled: true,
        closeButton: false,
        dismissible: true,
      },
    );

    promise
      .then(() => {
        toast.dismiss(id);
        showToast.success({ message: success });
      })
      .catch(() => {
        toast.dismiss(id);
        if (error) showToast.error({ message: error });
      });

    return id;
  },
};
