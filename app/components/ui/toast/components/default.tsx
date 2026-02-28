import React from 'react';
import BaseToast, { BaseToastProps } from './base';

type DefaultProps = Omit<BaseToastProps, 'colors'>;

const DefaultToast: React.FC<DefaultProps> = (props) => {
  return (
    <BaseToast
      {...props}
      colors={{
        bg: '#14161a',
        borderColor: '#26282D',
        text: '#fff',
        accent: '#9AA4B2',
        iconBg: '#1E2024',
      }}
    />
  );
};

export default DefaultToast;
