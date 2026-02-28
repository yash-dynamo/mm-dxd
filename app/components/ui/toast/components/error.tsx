import React from 'react';
import BaseToast, { BaseToastProps } from './base';
import { Iconify } from '@/components/ui/iconify';

type ErrorProps = Omit<BaseToastProps, 'colors'>;

const ErrorToast: React.FC<ErrorProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#1F1D1D',
        borderColor: '#302B2A',
        text: 'secondary.light',
        accent: '#F98D86 ',
        iconBg: '#4D2E2B',
      }}
      icon={<Iconify icon="solar:close-circle-bold" width={20} height={20} color="#F87168" />}
    />
  );
};

export default ErrorToast;
