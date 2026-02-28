import React from 'react';
import BaseToast, { BaseToastProps } from './base';
import { Iconify } from '@/components/ui/iconify';

type WarningProps = Omit<BaseToastProps, 'colors'>;

const WarningToast: React.FC<WarningProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#22201B',
        borderColor: '#302E2A',
        text: '#fff',
        accent: '#F4D975',
        iconBg: '#4E4225',
      }}
      icon={<Iconify icon="solar:danger-triangle-linear" width={20} height={20} color="#FEC84B" />}
    />
  );
};

export default WarningToast;
