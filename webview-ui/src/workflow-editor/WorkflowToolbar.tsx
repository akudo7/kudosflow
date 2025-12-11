import React from 'react';

interface Props {
  onSave: () => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  isDirty: boolean;
  hasSelection: boolean;
}

export const WorkflowToolbar: React.FC<Props> = ({
  onSave,
  onAddNode,
  onDeleteSelected,
  onDuplicateSelected,
  isDirty,
  hasSelection
}) => {
  const buttonStyle = (enabled: boolean) => ({
    background: enabled ? 'var(--vscode-button-background)' : 'var(--vscode-button-secondaryBackground)',
    color: enabled ? 'var(--vscode-button-foreground)' : 'var(--vscode-button-secondaryForeground)',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '3px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: '13px',
    fontFamily: 'var(--vscode-font-family)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    opacity: enabled ? 1 : 0.6,
  });

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
        onClick={onAddNode}
        style={buttonStyle(true)}
        title="新しいノードを追加"
      >
        ➕ ノード追加
      </button>
      <button
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        style={buttonStyle(hasSelection)}
        title="選択したノードを複製"
      >
        📋 複製
      </button>
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        style={buttonStyle(hasSelection)}
        title="選択したアイテムを削除 (Delete)"
      >
        🗑️ 削除
      </button>
      <div style={{ width: '1px', height: '24px', background: 'var(--vscode-widget-border)' }} />
      <button
        onClick={onSave}
        disabled={!isDirty}
        style={buttonStyle(isDirty)}
        title="ワークフローを保存 (Ctrl+S)"
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
