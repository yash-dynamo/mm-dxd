import React from 'react';
import BaseToast, { BaseToastProps } from './base';
import { Iconify } from '@/components/ui/iconify';

type InfoProps = Omit<BaseToastProps, 'colors'>;

const InfoToast: React.FC<InfoProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#1D1E22',
        borderColor: '#2B2C30',
        text: '#fff',
        accent: '#92AAFC',
        iconBg: '#2E344C',
      }}
      icon={<Iconify icon="solar:info-circle-bold" width={20} height={20} color="#718EF5" />}
    />
  );
};

export default InfoToast;
