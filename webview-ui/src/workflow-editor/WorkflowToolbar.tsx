import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSave: () => void;
  onAddNode: (nodeType: 'function' | 'tool') => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleSettings: () => void;
  isDirty: boolean;
  hasSelection: boolean;
}

export const WorkflowToolbar: React.FC<Props> = ({
  onSave,
  onAddNode,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleSettings,
  isDirty,
  hasSelection
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };

    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

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

  const handleAddNodeClick = (nodeType: 'function' | 'tool') => {
    onAddNode(nodeType);
    setShowAddMenu(false);
  };

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
      <div style={{ position: 'relative' }} ref={addMenuRef}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={buttonStyle(true)}
          title="新しいノードを追加"
        >
          ➕ ノード追加
        </button>
        {showAddMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: 'var(--vscode-dropdown-background)',
              border: '1px solid var(--vscode-widget-border)',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              minWidth: '180px',
              zIndex: 100,
            }}
          >
            <button
              onClick={() => handleAddNodeClick('function')}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--vscode-dropdown-foreground)',
                fontSize: '13px',
                fontFamily: 'var(--vscode-font-family)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>⚙️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>Function Node</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>通常の関数ノード</div>
              </div>
            </button>
            <button
              onClick={() => handleAddNodeClick('tool')}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--vscode-dropdown-foreground)',
                fontSize: '13px',
                fontFamily: 'var(--vscode-font-family)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>🛠️</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>ToolNode</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>ツールコールを実行</div>
              </div>
            </button>
          </div>
        )}
      </div>
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
        onClick={onToggleSettings}
        style={buttonStyle(true)}
        title="ワークフロー設定を開く"
      >
        ⚙️ 設定
      </button>
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
