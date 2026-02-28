'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores';
import { getLegalTermsStatus } from '@/utils/api';
import { Address } from 'viem';

export function useLegalTerms() {
  const { setLegalTermsSigned } = useAuthStore();

  const fetchLegalTermsStatus = useCallback(async (userAddress: Address) => {
    try {
      const response = await getLegalTermsStatus(userAddress);
      setLegalTermsSigned(userAddress, response.signed);
      return response.signed;
    } catch (error) {
      console.error('Error fetching legal terms status:', error);
      // Default to false if there's an error
      setLegalTermsSigned(userAddress, false);
      return false;
    }
  }, [setLegalTermsSigned]);

  return {
    fetchLegalTermsStatus,
  };
}
