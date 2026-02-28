import { useEffect, useState, useRef, useCallback } from 'react';
import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { IReferralSummary } from '@/types/trading';
import { useAccountActions } from '@/hooks/actions';
import { normalizeAddress } from '@/utils/formatting';
import { Address } from 'viem';

export function useReferralSummary() {
  const { infoClient } = useInfoClient();
  const { address, status } = useAuthStore();
  const setReferralSummary = useUserTradingDataStore((state) => state.setReferralSummary);
  // Use a selector to only subscribe to the specific address's data, not the entire object
  const referralData = useUserTradingDataStore((state) => state.referralSummary[address]);
  const { setReferrer } = useAccountActions();
  const [isLoading, setIsLoading] = useState(false);
  const hasSetReferrerRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchReferralSummary = useCallback(async (addr: string) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    // Normalize address before API call to ensure checksummed format
    const normalizedAddr = normalizeAddress(addr as Address);
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const res = (await infoClient.referralSummary({
        user: normalizedAddr,
      })) as unknown as IReferralSummary;
      setReferralSummary(res);
    } catch (e) {
      console.error('referralSummary fetch failed', e);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [infoClient, setReferralSummary]);

  useEffect(() => {
    // Only fetch if we have an address, are connected, and don't already have data
    if (address && status !== 'disconnected' && !referralData) {
      fetchReferralSummary(address);
    }
  }, [address, status, referralData, fetchReferralSummary]);

  useEffect(() => {
    if (address && status === 'trading-enabled' && !hasSetReferrerRef.current) {
      const backendCode = referralData?.referrer_code;

      if (!backendCode || backendCode === '') {
        try {
          const pendingReferrals = JSON.parse(localStorage.getItem('pendingReferralCodes') || '{}');
          const pendingCode = pendingReferrals[address];

          if (pendingCode && pendingCode !== '') {
            hasSetReferrerRef.current = true;
            setReferrer(pendingCode)
              .then(() => {
                console.log('Successfully set referrer code:', pendingCode);
                delete pendingReferrals[address];
                localStorage.setItem('pendingReferralCodes', JSON.stringify(pendingReferrals));
                fetchReferralSummary(address);
              })
              .catch((error) => {
                console.error('Failed to set referrer code:', error);
                delete pendingReferrals[address];
                localStorage.setItem('pendingReferralCodes', JSON.stringify(pendingReferrals));
                hasSetReferrerRef.current = false;
              });
          }
        } catch (error) {
          console.error('Error reading pending referral codes:', error);
        }
      }
    }
  }, [address, status, referralData, setReferrer, fetchReferralSummary]);

  return { fetchReferralSummary, isLoading };
}
