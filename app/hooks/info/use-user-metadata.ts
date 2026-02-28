import { useInfoClient } from './use-info-client';
import { useAuthStore, useUserTradingDataStore } from '@/stores';
import { IAccountInfo, IUserMetadata } from '@/types';
import { Address } from 'viem';

export function useUserMetadata() {
  const { setUserMetadata, setStatus, setIsUserMetadataLoading } = useAuthStore();
  const { setAccountInfo } = useUserTradingDataStore();
  const { infoClient } = useInfoClient();


  const fetchUserMetadata = async (account: Address) => {
    try {
      const userMetadata = (await infoClient.getUserMetadata({
        user: account,
      })) as IUserMetadata;
      setUserMetadata(account, userMetadata);
    } catch (error) {
      console.error('Error fetching user metadata:', error);
    } finally {
      setIsUserMetadataLoading(false);
    }
  };

  const fetchAccountInfo = async (account: Address) => {
    try {
      const accountInfo = (await infoClient.accountInfo({
        user: account,
      })) as IAccountInfo | { error: string };

      if ('error' in accountInfo && accountInfo.error === 'account not found') {
        setAccountInfo(account, null);
        return;
      }

      setAccountInfo(account, accountInfo as IAccountInfo);
    } catch (error) {
      console.error('Error fetching user metadata:', error);
    }
  };


  return {
    fetchUserMetadata,
    fetchAccountInfo,
  };
}
