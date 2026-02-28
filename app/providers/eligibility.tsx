'use client';

import { Address } from 'viem';
import { useAuthStore } from '@/stores';
import { FC, useEffect } from 'react';
import { useUserMetadata, useLegalTerms } from '@/hooks/info';
import Loader from '@/components/ui/loader';

export const EligibiltyProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address, status } = useAuthStore();
    const { fetchUserMetadata } = useUserMetadata();
    const { fetchLegalTermsStatus } = useLegalTerms();
    const { isUserMetadataLoading } = useAuthStore();

    const isConnected = address && address !== '0x0000000000000000000000000000000000000000' && status !== 'disconnected';

    useEffect(() => {
        if (isConnected) {
            fetchUserMetadata(address as Address);
            fetchLegalTermsStatus(address as Address);
        }
    }, [address, status]);


    if (isUserMetadataLoading && isConnected) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return <>{children}</>;
};
