'use client';

import { useCallback, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useDxdAuthStore } from '@/stores';
import { dxdApi, DxdApiError, DxdNetworkError } from '@/lib/dxd-api';
import { env } from '@/config/env';

export type DxdAuthStatus = 'idle' | 'requesting-nonce' | 'signing' | 'verifying' | 'done' | 'error';

const isGenericHttpDetail = (detail: string) => /^HTTP\s+\d{3}$/i.test(detail.trim());
const showDetailedErrors = env.NEXT_PUBLIC_DXD_SHOW_DETAILED_ERRORS === 'true';

const toAuthErrorMessage = (err: unknown) => {
  if (err instanceof DxdNetworkError) {
    if (showDetailedErrors) return `Network error: ${err.message}`;
    return 'Server is not responding — check that the DXD backend is running.';
  }

  if (err instanceof DxdApiError) {
    if (showDetailedErrors) return `${err.detail} (HTTP ${err.status})`;
    if (err.status === 503) {
      return 'Authentication backend is temporarily unavailable. Please retry in a few seconds.';
    }
    if (err.status >= 500) {
      return 'Authentication service is temporarily unavailable. Please try again in a few seconds.';
    }
    if (err.status === 401) {
      return 'Authentication failed. Please sign the login message again.';
    }
    return isGenericHttpDetail(err.detail) ? 'Authentication failed. Please try again.' : err.detail;
  }

  if (err instanceof Error) {
    if (showDetailedErrors) return err.message;
    const lower = err.message.toLowerCase();
    if (
      lower.includes('user rejected')
      || lower.includes('user denied')
      || lower.includes('rejected the request')
      || lower.includes('rejected request')
    ) {
      return 'Signature was rejected in wallet.';
    }
    return err.message;
  }

  return 'Sign-in failed';
};

export function useDxdAuth() {
  const [status, setStatus] = useState<DxdAuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { address: wagmiAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { setDxdAuth, clearDxdAuth, token, isAuthenticated } = useDxdAuthStore();

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!wagmiAddress) {
      setError('No wallet connected');
      return false;
    }

    try {
      setError(null);

      // 1. POST /v1/auth/nonce — get the message to sign
      setStatus('requesting-nonce');
      const { message } = await dxdApi.nonce(wagmiAddress);

      // 2. EIP-191 personal_sign via the connected wallet
      setStatus('signing');
      const signature = await signMessageAsync({ message });

      // 3. POST /v1/auth/login — verify signature, receive JWT
      setStatus('verifying');
      const { token, user_id, wallet_address } = await dxdApi.login(wagmiAddress, signature);

      setDxdAuth(token, user_id, wallet_address);
      setStatus('done');
      return true;
    } catch (err) {
      const msg = toAuthErrorMessage(err);
      setError(msg);
      setStatus('error');
      return false;
    }
  }, [wagmiAddress, signMessageAsync, setDxdAuth]);

  /**
   * Wraps any authenticated API call. On 401 (expired JWT),
   * transparently re-runs nonce → sign → login and retries once.
   */
  const withAuth = useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      const currentToken = useDxdAuthStore.getState().token;
      if (!currentToken) {
        const ok = await signIn();
        if (!ok) {
          clearDxdAuth();
          throw new DxdApiError(401, 'Authentication required');
        }
        return fn(useDxdAuthStore.getState().token!);
      }
      try {
        return await fn(currentToken);
      } catch (err) {
        if (err instanceof DxdApiError && err.status === 401) {
          const ok = await signIn();
          if (!ok) {
            clearDxdAuth();
            throw err;
          }
          return fn(useDxdAuthStore.getState().token!);
        }
        throw err;
      }
    },
    [signIn, clearDxdAuth],
  );

  return { signIn, withAuth, status, error, token, isAuthenticated, walletAddress: wagmiAddress };
}
