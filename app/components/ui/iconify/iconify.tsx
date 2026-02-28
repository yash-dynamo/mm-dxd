'use client';

import type { IconProps } from '@iconify/react';

import { Icon } from '@iconify/react';
import { forwardRef } from 'react';

// ----------------------------------------------------------------------

export type IconifyProps = IconProps & {
  className?: string;
};

export const Iconify = forwardRef<SVGSVGElement, IconifyProps>((props, ref) => {
  const { className, width = 20, ...other } = props;

  return (
    <Icon
      ref={ref}
      className={className}
      width={width}
      height={width}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        transition: 'color 0.2s ease',
      }}
      {...other}
    />
  );
});

Iconify.displayName = 'Iconify';
