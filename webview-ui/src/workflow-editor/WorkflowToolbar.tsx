import React from 'react';

interface Props {
  onSave: () => void;
  isDirty: boolean;
}

export const WorkflowToolbar: React.FC<Props> = ({ onSave, isDirty }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: 'var(--vscode-editor-background)',
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--vscode-widget-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <button
        onClick={onSave}
        disabled={!isDirty}
        style={{
          background: isDirty ? 'var(--vscode-button-background)' : 'var(--vscode-button-secondaryBackground)',
          color: isDirty ? 'var(--vscode-button-foreground)' : 'var(--vscode-button-secondaryForeground)',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '3px',
          cursor: isDirty ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          fontFamily: 'var(--vscode-font-family)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        💾 保存
        {isDirty && (
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--vscode-notificationsErrorIcon-foreground)',
            }}
          />
        )}
      </button>
    </div>
  );
};
