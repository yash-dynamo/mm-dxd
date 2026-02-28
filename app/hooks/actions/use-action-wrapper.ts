import { useCallback } from 'react';
import { useExchangeClient } from './use-exchange-client';
import { ExchangeClient, HttpTransport } from '@0xsyndr/ts-sdk';
import { showToast } from '@/components/ui/toast';
import { ActionContext, ActionHandler, actions, config } from './config';
import { ToastParams } from '@/components/ui/toast';
import { getErrorMessage, getErrorOverride } from '@/utils/error';

// Helper function to capitalize first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const getDefaultToastTitle = (name: string, type: 'success' | 'error' | 'loading') => {
  return `${capitalize(name)}: ${type}`;
};

export const getToast = async <T>(
  config: config<T>,
  type: 'success' | 'error' | 'loading',
  context: ActionContext<T> = {},
): Promise<ToastParams & { error?: boolean }> => {
  const handler = config?.[type] as ActionHandler<T> | undefined;
  if (!handler) {
    return {
      message: getDefaultToastTitle(config.name, type),
    } as ToastParams;
  }

  const message = typeof handler === 'function' ? await handler(context) : handler;
  return {
    message: message.title ?? getDefaultToastTitle(config.name, type),
    description: message?.description,
    error: message?.error,
  } as ToastParams;
};

export function useActionWrapper() {
  const { createUserClient, createL1Client } = useExchangeClient();

  const executeUserAction = useCallback(
    async <T>(
      config: (typeof actions)[keyof typeof actions] | string,
      action: (client: ExchangeClient<HttpTransport, unknown>) => Promise<T>,
      skipToast: boolean = false,
      context: ActionContext<T> = {},
    ): Promise<ActionResult<T>> => {
      const toastConfig =
        typeof config === 'string'
          ? {
              name: config,
            }
          : config;

      try {
        const client = await createUserClient();
        if (!client) {
          const error = 'Failed to create user client';
          throw new Error(error);
        }

        const data = await action(client);

        if (!skipToast) {
          const successToast = await getToast(toastConfig, 'success', { ...context, data });
          if (successToast.error) {
            showToast.error(successToast);
            return { success: false, error: successToast.description };
          }
          showToast.success(successToast);
        }

        return { success: true, data };
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (!skipToast) {
          if (errorMessage) {
            const overrideMessage = getErrorOverride(errorMessage);
            if (overrideMessage !== false) {
              showToast.error(
                await getToast(toastConfig, 'error', {
                  ...context,
                  error: overrideMessage ?? errorMessage,
                }),
              );
            }
          } else {
            showToast.error(
              await getToast(toastConfig, 'error', {
                ...context,
                message: 'Something went wrong',
              }),
            );
          }
        }
        return { success: false, error: errorMessage };
      }
    },
    [createUserClient],
  );

  const executeL1Action = useCallback(
    async <T>(
      config: (typeof actions)[keyof typeof actions] | string,
      action: (client: ExchangeClient<HttpTransport, unknown>) => Promise<T>,
      skipToast: boolean = false,
      context: ActionContext<T> = {},
    ): Promise<ActionResult<T>> => {
      const toastConfig =
        typeof config === 'string'
          ? {
              name: config,
            }
          : config;

      try {
        const client = createL1Client();

        if (!client) {
          const error = 'Failed to create L1 client';
          console.error(error);
          return { success: false, error };
        }

        let data = await action(client);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any

        const error = (data as any)?.data?.status?.[0]?.error?.error;
        if (error) {
          const overrideMessage = getErrorOverride(error);
          if (!skipToast && overrideMessage !== false) {
            showToast.error(
              await getToast(toastConfig, 'error', {
                ...context,
                error: overrideMessage ?? error,
                data,
              }),
            );
          }
          return { success: false, error };
        }

        const successToast = await getToast(toastConfig, 'success', { ...context, data });
        if (!skipToast) {
          if (successToast.error) {
            showToast.error(successToast);
            return { success: false, error: successToast.description };
          }
          showToast.success(successToast);
        }

        return { success: true, data };
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        if (errorMessage) {
          const overrideMessage = getErrorOverride(errorMessage);
          if (!skipToast) {
            if (overrideMessage !== false) {
              showToast.error(
                await getToast(toastConfig, 'error', {
                  ...context,
                  error: overrideMessage ?? errorMessage,
                }),
              );
            }
          }
        } else {
          if (!skipToast) {
            showToast.error(
              await getToast(toastConfig, 'error', { ...context, message: 'Something went wrong' }),
            );
          }
        }

        return { success: false, error: errorMessage };
      }
    },
    [createL1Client],
  );

  return {
    executeUserAction,
    executeL1Action,
    userClient: createUserClient,
    l1Client: createL1Client,
  };
}
