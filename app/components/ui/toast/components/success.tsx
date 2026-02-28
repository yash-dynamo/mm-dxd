import React from 'react';
import BaseToast, { BaseToastProps } from './base';
import { Iconify } from '@/components/ui/iconify';

type SuccessProps = Omit<BaseToastProps, 'colors'>;

const SuccessToast: React.FC<SuccessProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#18201D',
        borderColor: '#272E2B',
        text: '#fff',
        accent: '#77ED8B',
        iconBg: '#134430',
      }}
      icon={<Iconify icon="solar:check-circle-bold" width={20} height={20} color="#00D47E" />}
    />
  );
};

export default SuccessToast;
