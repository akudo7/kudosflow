import React, { useState } from 'react';
import { ReactFlowNode } from '../types/workflow.types';
import { validateNodeName } from '../utils/validation';

interface Props {
  nodes: ReactFlowNode[];
  onNodeNameChange: (oldId: string, newId: string) => void;
}

export const NodeNameEditor: React.FC<Props> = ({ nodes, onNodeNameChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = (nodeId: string) => {
    setEditingId(nodeId);
    setEditValue(nodeId);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const handleSaveEdit = (oldId: string) => {
    const trimmedValue = editValue.trim();

    // Validate
    const validation = validateNodeName(trimmedValue, nodes, oldId);
    if (!validation.valid) {
      setError(validation.error || '無効なノード名です');
      return;
    }

    // Save
    if (trimmedValue !== oldId) {
      onNodeNameChange(oldId, trimmedValue);
    }

    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, oldId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(oldId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
  };

  const nodeItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    background: 'var(--vscode-input-background)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '3px',
    gap: '8px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-inputValidation-infoBorder)',
    borderRadius: '3px',
    padding: '4px 8px',
    fontSize: '13px',
    fontFamily: 'var(--vscode-editor-font-family)',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '3px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
  };

  const errorStyle: React.CSSProperties = {
    color: 'var(--vscode-inputValidation-errorForeground)',
    fontSize: '12px',
    marginTop: '4px',
  };

  return (
    <div style={containerStyle}>
      <div style={{
        fontSize: '13px',
        color: 'var(--vscode-descriptionForeground)',
        marginBottom: '4px'
      }}>
        ノード名をダブルクリックして編集できます
      </div>
      {nodes.map((node) => (
        <div key={node.id} style={nodeItemStyle}>
          {editingId === node.id ? (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, node.id)}
                  style={inputStyle}
                  autoFocus
                />
                <button onClick={() => handleSaveEdit(node.id)} style={buttonStyle}>
                  保存
                </button>
                <button onClick={handleCancelEdit} style={cancelButtonStyle}>
                  キャンセル
                </button>
              </div>
              {error && <div style={errorStyle}>{error}</div>}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'var(--vscode-editor-font-family)',
              }}
              onDoubleClick={() => handleStartEdit(node.id)}
              title="ダブルクリックして編集"
            >
              {node.id}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
