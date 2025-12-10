import React, { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const SaveNotification: React.FC<Props> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const backgroundColor =
    type === 'success'
      ? 'var(--vscode-notificationsInfoIcon-foreground)'
      : 'var(--vscode-notificationsErrorIcon-foreground)';

  const icon = type === 'success' ? '✓' : '✗';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        background: 'var(--vscode-notifications-background)',
        border: `1px solid ${backgroundColor}`,
        borderRadius: '4px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '250px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span
        style={{
          fontSize: '18px',
          color: backgroundColor,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: '13px',
          color: 'var(--vscode-notifications-foreground)',
          fontFamily: 'var(--vscode-font-family)',
        }}
      >
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--vscode-notifications-foreground)',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0 4px',
          lineHeight: '1',
        }}
      >
        ×
      </button>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};
