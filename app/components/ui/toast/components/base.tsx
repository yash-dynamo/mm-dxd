import React from 'react';
import { Iconify } from '@/components/ui/iconify';

export type ToastAction = { label: string; onClick: () => void };

export type BaseToastProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onClose?: () => void;
  action?: ToastAction;
  colors?: {
    bg?: string;
    text?: string;
    accent?: string;
    iconBg?: string;
    borderColor?: string;
  };
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
  minWidth: 360,
  maxWidth: 480,
  minHeight: 'fit-content',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  paddingLeft: '4px',
};

const iconSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: '8px',
  margin: '12px 0',
  alignSelf: 'flex-start',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  alignSelf: 'center',
};

const actionStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  padding: '8px 12px',
  marginRight: 8,
};

const closeStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  padding: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  position: 'absolute',
  right: 0,
  top: 0,
};

const BaseToast: React.FC<BaseToastProps> = ({
  icon,
  title,
  description,
  onClose,
  action,
  colors,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        border: `2px solid ${colors?.borderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          ...containerStyle,
          background: colors?.bg ?? '#14161a',
        }}
      >
        {icon && (
          <div
            style={{
              ...iconSectionStyle,
              background: colors?.iconBg ?? 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {icon}
          </div>
        )}
        <div style={contentStyle}>
          <p className="text-xs text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && action.label && (
          <button
            style={{ ...actionStyle, color: colors?.accent ?? '#93EA5D' }}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
        <button
          style={{
            ...closeStyle,
            color: isHovered ? '#FFFFFF' : '#ADADAD',
          }}
          aria-label="Dismiss"
          onClick={onClose}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Iconify icon="mingcute:close-line" width={12} height={12} />
        </button>
      </div>
    </div>
  );
};

export default BaseToast;
