import React, { useState, useEffect } from 'react';
import { A2AServerConfig } from '../types/workflow.types';
import { isValidJSIdentifier } from '../utils/validation';

interface Props {
  show: boolean;
  clientId?: string;
  clientConfig?: A2AServerConfig;
  existingClientIds: string[];
  onSave: (clientId: string, clientConfig: A2AServerConfig) => void;
  onCancel: () => void;
}

export const A2AClientFormModal: React.FC<Props> = ({
  show,
  clientId,
  clientConfig,
  existingClientIds,
  onSave,
  onCancel,
}) => {
  const isEditing = !!clientId;

  const [formClientId, setFormClientId] = useState(clientId || '');
  const [cardUrl, setCardUrl] = useState(clientConfig?.cardUrl || '');
  const [timeout, setTimeout] = useState<number>(clientConfig?.timeout || 30000);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setFormClientId(clientId || '');
      setCardUrl(clientConfig?.cardUrl || '');
      setTimeout(clientConfig?.timeout || 30000);
      setError('');
    }
  }, [show, clientId, clientConfig]);

  const handleSave = () => {
    // Validate client ID
    if (!formClientId.trim()) {
      setError('Client IDを入力してください');
      return;
    }

    if (!isValidJSIdentifier(formClientId)) {
      setError('Client IDは有効なJavaScript識別子である必要があります');
      return;
    }

    // Check if client ID already exists (only when creating new or changing ID)
    if ((!isEditing || formClientId !== clientId) && existingClientIds.includes(formClientId)) {
      setError('このClient IDは既に存在します');
      return;
    }

    // Validate card URL
    if (!cardUrl.trim()) {
      setError('Card URLを入力してください');
      return;
    }

    try {
      new URL(cardUrl);
    } catch {
      setError('有効なURLを入力してください');
      return;
    }

    // Validate timeout
    if (timeout <= 0) {
      setError('Timeoutは正の数である必要があります');
      return;
    }

    // Build server config
    const newServerConfig: A2AServerConfig = {
      cardUrl,
      timeout,
    };

    onSave(formClientId, newServerConfig);
  };

  if (!show) {
    return null;
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--vscode-foreground)',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--vscode-foreground)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    fontSize: '13px',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    fontFamily: 'var(--vscode-font-family)',
    boxSizing: 'border-box',
  };

  const errorStyle: React.CSSProperties = {
    padding: '8px 12px',
    marginBottom: '16px',
    background: 'var(--vscode-inputValidation-errorBackground)',
    border: '1px solid var(--vscode-inputValidation-errorBorder)',
    color: 'var(--vscode-errorForeground)',
    fontSize: '12px',
    borderRadius: '2px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderTop: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: 'var(--vscode-font-family)',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
  };

  const saveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    marginTop: '4px',
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          {isEditing ? 'Edit A2A Server' : 'Add A2A Server'}
        </div>

        <div style={bodyStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          <div style={fieldStyle}>
            <label style={labelStyle}>Client ID *</label>
            <input
              type="text"
              style={inputStyle}
              value={formClientId}
              onChange={(e) => setFormClientId(e.target.value)}
              placeholder="task_agent"
            />
            <div style={hintStyle}>Valid JavaScript identifier (e.g., task_agent, research_agent)</div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Card URL *</label>
            <input
              type="text"
              style={inputStyle}
              value={cardUrl}
              onChange={(e) => setCardUrl(e.target.value)}
              placeholder="http://localhost:3001/.well-known/agent.json"
            />
            <div style={hintStyle}>
              Agent card endpoint URL (e.g., http://localhost:3001/.well-known/agent.json)
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Timeout (ms) *</label>
            <input
              type="number"
              style={inputStyle}
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value, 10) || 0)}
              placeholder="30000"
              min="1"
            />
            <div style={hintStyle}>Request timeout (milliseconds)</div>
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onCancel} style={cancelButtonStyle}>
            Cancel
          </button>
          <button onClick={handleSave} style={saveButtonStyle}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
