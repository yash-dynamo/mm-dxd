import React from 'react';
import BaseToast, { BaseToastProps } from './base';
import { Iconify } from '@/components/ui/iconify';

type LoadingProps = Omit<BaseToastProps, 'colors'>;

const LoadingToast: React.FC<LoadingProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#1A1C20',
        borderColor: '#2A2D33',
        text: '#fff',
        accent: '#9AA4B2',
        iconBg: '#20242B',
      }}
      icon={<Iconify icon="svg-spinners:180-ring" width={20} height={20} color="#9AA4B2" />}
    />
  );
};

export default LoadingToast;
