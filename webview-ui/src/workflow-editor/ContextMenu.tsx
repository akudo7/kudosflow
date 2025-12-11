import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<Props> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000,
        background: 'var(--vscode-menu-background)',
        border: '1px solid var(--vscode-menu-border)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        minWidth: '160px',
        padding: '4px 0',
        fontFamily: 'var(--vscode-font-family)',
        fontSize: '13px',
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          style={{
            padding: '6px 16px',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            color: item.disabled
              ? 'var(--vscode-disabledForeground)'
              : 'var(--vscode-menu-foreground)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: item.disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.style.background = 'var(--vscode-menu-selectionBackground)';
              e.currentTarget.style.color = 'var(--vscode-menu-selectionForeground)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = item.disabled
              ? 'var(--vscode-disabledForeground)'
              : 'var(--vscode-menu-foreground)';
          }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
